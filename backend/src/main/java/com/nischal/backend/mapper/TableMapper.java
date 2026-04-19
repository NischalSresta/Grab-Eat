package com.nischal.backend.mapper;

import com.nischal.backend.dto.table.BookingResponse;
import com.nischal.backend.dto.table.TableResponse;
import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableBooking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TableMapper {

    TableResponse toTableResponse(RestaurantTable table);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userFullName")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "table.id", target = "tableId")
    @Mapping(source = "table.tableNumber", target = "tableNumber")
    @Mapping(source = "table.capacity", target = "tableCapacity")
    @Mapping(source = "table.floor", target = "tableFloor")
    @Mapping(source = "table.qrToken", target = "tableQrToken")
    BookingResponse toBookingResponse(TableBooking booking);
}
