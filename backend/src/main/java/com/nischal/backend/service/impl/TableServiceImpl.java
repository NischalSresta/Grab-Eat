package com.nischal.backend.service.impl;

import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.RestaurantTableRepository;
import com.nischal.backend.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional
    public RestaurantTable createTable(String tableNumber, int capacity, TableFloor floor) {
        if (tableRepository.existsByTableNumber(tableNumber)) {
            throw new BadRequestException("Table number already exists: " + tableNumber);
        }
        String qrToken = UUID.randomUUID().toString();
        RestaurantTable table = RestaurantTable.builder()
                .tableNumber(tableNumber)
                .capacity(capacity)
                .floor(floor)
                .status(TableStatus.AVAILABLE)
                .qrToken(qrToken)
                .build();
        return tableRepository.save(table);
    }

    @Override
    public RestaurantTable getTableById(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));
    }

    @Override
    public RestaurantTable getTableByQrToken(String qrToken) {
        return tableRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found for given QR token"));
    }

    @Override
    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }

    @Override
    public List<RestaurantTable> getTablesByFloor(TableFloor floor) {
        return tableRepository.findByFloor(floor);
    }

    @Override
    @Transactional
    public RestaurantTable updateTableStatus(Long id, TableStatus status) {
        RestaurantTable table = getTableById(id);
        table.setStatus(status);
        return tableRepository.save(table);
    }

    @Override
    @Transactional
    public RestaurantTable updateTable(Long id, String tableNumber, int capacity, TableFloor floor) {
        RestaurantTable table = getTableById(id);
        if (!table.getTableNumber().equals(tableNumber) && tableRepository.existsByTableNumber(tableNumber)) {
            throw new BadRequestException("Table number already exists: " + tableNumber);
        }
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);
        table.setFloor(floor);
        return tableRepository.save(table);
    }

    @Override
    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = getTableById(id);
        tableRepository.delete(table);
    }

    @Override
    @Transactional
    public String generateQrToken(Long tableId) {
        RestaurantTable table = getTableById(tableId);
        String newToken = UUID.randomUUID().toString();
        table.setQrToken(newToken);
        tableRepository.save(table);
        return newToken;
    }
}
