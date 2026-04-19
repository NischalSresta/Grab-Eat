package com.nischal.backend.service.impl;

import com.nischal.backend.dto.table.BookingResponse;
import com.nischal.backend.dto.table.CreateBookingRequest;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.entity.BookingStatus;
import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableBooking;
import com.nischal.backend.entity.TableStatus;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.exception.UnauthorizedException;
import com.nischal.backend.mapper.TableMapper;
import com.nischal.backend.repository.RestaurantTableRepository;
import com.nischal.backend.repository.TableBookingRepository;
import com.nischal.backend.repository.UserRepository;
import com.nischal.backend.service.TableBookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TableBookingServiceImpl implements TableBookingService {

    private final TableBookingRepository bookingRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final TableMapper tableMapper;

    @Override
    @Transactional
    public BookingResponse createBooking(Long userId, CreateBookingRequest request) {
        validateBookingRequest(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + request.getTableId()));

        if (!table.getIsActive()) {
            throw new BadRequestException("This table is not available for booking");
        }

        if (request.getPartySize() > table.getCapacity()) {
            throw new BadRequestException("Party size (" + request.getPartySize() + ") exceeds table capacity (" + table.getCapacity() + ")");
        }

        boolean conflict = bookingRepository.existsConflictingBooking(
                table.getId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                null
        );
        if (conflict) {
            throw new BadRequestException("This table is already booked for the selected date and time");
        }

        TableBooking booking = TableBooking.builder()
                .user(user)
                .table(table)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .partySize(request.getPartySize())
                .specialRequests(request.getSpecialRequests())
                .status(BookingStatus.PENDING)
                .build();

        TableBooking saved = bookingRepository.save(booking);

        // Sync table status: a new PENDING booking means the table is now RESERVED
        if (table.getStatus() == TableStatus.AVAILABLE) {
            table.setStatus(TableStatus.RESERVED);
            tableRepository.save(table);
        }

        log.info("Created booking #{} for user {} at table {}", saved.getId(), userId, table.getTableNumber());
        return tableMapper.toBookingResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse getBookingById(Long bookingId, Long requestingUserId) {
        TableBooking booking = findBookingOrThrow(bookingId);
        if (!booking.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You do not have permission to view this booking");
        }
        backfillQrToken(booking.getTable());
        return tableMapper.toBookingResponse(booking);
    }

    @Override
    @Transactional
    public PageResponse<BookingResponse> getUserBookings(Long userId, Pageable pageable) {
        Page<TableBooking> page = bookingRepository.findByUserId(userId, pageable);
        backfillQrTokens(page.getContent());
        List<BookingResponse> content = page.getContent().stream()
                .map(tableMapper::toBookingResponse)
                .collect(Collectors.toList());
        return PageResponse.<BookingResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .empty(page.isEmpty())
                .build();
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long requestingUserId) {
        TableBooking booking = findBookingOrThrow(bookingId);

        if (!booking.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You do not have permission to cancel this booking");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Completed bookings cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        TableBooking saved = bookingRepository.save(booking);

        // Sync table status: if no other active bookings remain, release the table
        syncTableStatusAfterRelease(booking.getTable());

        log.info("Customer cancelled booking #{}", bookingId);
        return tableMapper.toBookingResponse(saved);
    }

    // Admin operations

    @Override
    @Transactional
    public List<BookingResponse> getActiveBookings() {
        List<TableBooking> bookings = bookingRepository.findByStatusIn(
                List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED)
        );
        backfillQrTokens(bookings);
        return bookings.stream()
                .map(tableMapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<BookingResponse> getBookingsByTable(Long tableId) {
        List<TableBooking> bookings = bookingRepository.findByTableIdOrderByCreatedAtDesc(tableId);
        backfillQrTokens(bookings);
        return bookings.stream()
                .map(tableMapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PageResponse<BookingResponse> getAllBookings(Pageable pageable) {
        Page<TableBooking> page = bookingRepository.findAllByOrderByCreatedAtDesc(pageable);
        backfillQrTokens(page.getContent());
        List<BookingResponse> content = page.getContent().stream()
                .map(tableMapper::toBookingResponse)
                .collect(Collectors.toList());
        return PageResponse.<BookingResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .empty(page.isEmpty())
                .build();
    }

    @Override
    @Transactional
    public BookingResponse confirmBooking(Long bookingId) {
        TableBooking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be confirmed");
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        TableBooking confirmed = bookingRepository.save(booking);

        // Sync table status: CONFIRMED booking → table is RESERVED
        RestaurantTable table = booking.getTable();
        if (table.getStatus() != TableStatus.RESERVED) {
            table.setStatus(TableStatus.RESERVED);
            tableRepository.save(table);
        }

        return tableMapper.toBookingResponse(confirmed);
    }

    @Override
    @Transactional
    public BookingResponse completeBooking(Long bookingId) {
        TableBooking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Only CONFIRMED bookings can be completed");
        }
        booking.setStatus(BookingStatus.COMPLETED);
        TableBooking completed = bookingRepository.save(booking);

        // Sync table status: booking completed → release table if no other active bookings
        syncTableStatusAfterRelease(booking.getTable());

        return tableMapper.toBookingResponse(completed);
    }

    @Override
    @Transactional
    public BookingResponse adminCancelBooking(Long bookingId) {
        TableBooking booking = findBookingOrThrow(bookingId);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Completed bookings cannot be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        TableBooking cancelled = bookingRepository.save(booking);

        // Sync table status: admin cancelled → release table if no other active bookings
        syncTableStatusAfterRelease(booking.getTable());

        return tableMapper.toBookingResponse(cancelled);
    }

    private TableBooking findBookingOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
    }

    private void validateBookingRequest(CreateBookingRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }
    }

    /** Ensures the given table has a qrToken, generating and saving one if missing. */
    private void backfillQrToken(RestaurantTable table) {
        if (table.getQrToken() == null || table.getQrToken().isBlank()) {
            table.setQrToken(UUID.randomUUID().toString());
            tableRepository.save(table);
            log.info("Backfilled qrToken for table {}", table.getTableNumber());
        }
    }

    /**
     * After a booking is cancelled or completed, checks if any other PENDING or CONFIRMED
     * bookings exist for the same table. If not, resets the table status to AVAILABLE.
     * Tables in MAINTENANCE are never touched by this method.
     */
    private void syncTableStatusAfterRelease(RestaurantTable table) {
        if (table.getStatus() == TableStatus.MAINTENANCE) return;
        boolean hasActiveBookings = bookingRepository.existsByTableIdAndStatusIn(
                table.getId(), List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED)
        );
        if (!hasActiveBookings) {
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
            log.info("Table {} status reset to AVAILABLE after booking release", table.getTableNumber());
        }
    }

    /** Ensures all tables referenced by the given bookings have qrTokens. */
    private void backfillQrTokens(List<TableBooking> bookings) {
        List<RestaurantTable> missing = bookings.stream()
                .map(TableBooking::getTable)
                .filter(t -> t.getQrToken() == null || t.getQrToken().isBlank())
                .distinct()
                .collect(Collectors.toList());
        if (!missing.isEmpty()) {
            missing.forEach(t -> t.setQrToken(UUID.randomUUID().toString()));
            tableRepository.saveAll(missing);
            log.info("Backfilled qrToken for {} tables via booking fetch", missing.size());
        }
    }
}
