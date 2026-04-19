package com.nischal.backend.service.impl;

import com.nischal.backend.dto.table.CreateTableRequest;
import com.nischal.backend.dto.table.TableResponse;
import com.nischal.backend.dto.table.UpdateTableRequest;
import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.mapper.TableMapper;
import com.nischal.backend.repository.RestaurantTableRepository;
import com.nischal.backend.service.TableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final RestaurantTableRepository tableRepository;
    private final TableMapper tableMapper;

    @Override
    @Transactional
    public List<TableResponse> getAllTables() {
        List<RestaurantTable> tables = tableRepository.findByIsActiveTrue();
        // Backfill any tables that were created before the qrToken column was added
        List<RestaurantTable> missing = tables.stream()
                .filter(t -> t.getQrToken() == null || t.getQrToken().isBlank())
                .collect(Collectors.toList());
        if (!missing.isEmpty()) {
            missing.forEach(t -> t.setQrToken(UUID.randomUUID().toString()));
            tableRepository.saveAll(missing);
            log.info("Backfilled qrToken for {} tables", missing.size());
        }
        return tables.stream()
                .map(tableMapper::toTableResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getTablesByFloor(TableFloor floor) {
        return tableRepository.findByFloorAndIsActiveTrue(floor)
                .stream()
                .map(tableMapper::toTableResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables(LocalDate bookingDate, LocalTime startTime, LocalTime endTime, Integer partySize) {
        validateTimeRange(startTime, endTime);
        return tableRepository.findAvailableTables(bookingDate, startTime, endTime, partySize)
                .stream()
                .map(tableMapper::toTableResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTablesByFloor(LocalDate bookingDate, LocalTime startTime, LocalTime endTime, Integer partySize, TableFloor floor) {
        validateTimeRange(startTime, endTime);
        return tableRepository.findAvailableTablesByFloor(bookingDate, startTime, endTime, partySize, floor)
                .stream()
                .map(tableMapper::toTableResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TableResponse getTableById(Long id) {
        RestaurantTable table = findTableOrThrow(id);
        if (table.getQrToken() == null || table.getQrToken().isBlank()) {
            table.setQrToken(UUID.randomUUID().toString());
            tableRepository.save(table);
        }
        return tableMapper.toTableResponse(table);
    }

    @Override
    @Transactional
    public TableResponse createTable(CreateTableRequest request) {
        if (tableRepository.existsByTableNumber(request.getTableNumber())) {
            throw new BadRequestException("Table number '" + request.getTableNumber() + "' already exists");
        }

        RestaurantTable table = RestaurantTable.builder()
                .tableNumber(request.getTableNumber())
                .capacity(request.getCapacity())
                .floor(request.getFloor())
                .description(request.getDescription())
                .build();

        RestaurantTable saved = tableRepository.save(table);
        log.info("Created table: {}", saved.getTableNumber());
        return tableMapper.toTableResponse(saved);
    }

    @Override
    @Transactional
    public TableResponse updateTable(Long id, UpdateTableRequest request) {
        RestaurantTable table = findTableOrThrow(id);

        if (request.getTableNumber() != null && !request.getTableNumber().equals(table.getTableNumber())) {
            if (tableRepository.existsByTableNumber(request.getTableNumber())) {
                throw new BadRequestException("Table number '" + request.getTableNumber() + "' already exists");
            }
            table.setTableNumber(request.getTableNumber());
        }
        if (request.getCapacity() != null) table.setCapacity(request.getCapacity());
        if (request.getFloor() != null) table.setFloor(request.getFloor());
        if (request.getStatus() != null) table.setStatus(request.getStatus());
        if (request.getDescription() != null) table.setDescription(request.getDescription());
        if (request.getIsActive() != null) table.setIsActive(request.getIsActive());
        if (request.getAssignedWaiter() != null) table.setAssignedWaiter(request.getAssignedWaiter());

        RestaurantTable saved = tableRepository.save(table);
        log.info("Updated table: {}", saved.getTableNumber());
        return tableMapper.toTableResponse(saved);
    }

    @Override
    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = findTableOrThrow(id);
        table.setIsActive(false);
        tableRepository.save(table);
        log.info("Soft-deleted table: {}", table.getTableNumber());
    }

    private RestaurantTable findTableOrThrow(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
    }
}
