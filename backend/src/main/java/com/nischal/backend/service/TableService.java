package com.nischal.backend.service;

import com.nischal.backend.dto.table.CreateTableRequest;
import com.nischal.backend.dto.table.TableResponse;
import com.nischal.backend.dto.table.UpdateTableRequest;
import com.nischal.backend.entity.TableFloor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface TableService {

    List<TableResponse> getAllTables();

    List<TableResponse> getTablesByFloor(TableFloor floor);

    List<TableResponse> getAvailableTables(LocalDate bookingDate, LocalTime startTime, LocalTime endTime, Integer partySize);

    List<TableResponse> getAvailableTablesByFloor(LocalDate bookingDate, LocalTime startTime, LocalTime endTime, Integer partySize, TableFloor floor);

    TableResponse getTableById(Long id);

    TableResponse createTable(CreateTableRequest request);

    TableResponse updateTable(Long id, UpdateTableRequest request);

    void deleteTable(Long id);
}
