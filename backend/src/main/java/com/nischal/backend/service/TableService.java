package com.nischal.backend.service;

import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;

import java.util.List;

public interface TableService {

    RestaurantTable createTable(String tableNumber, int capacity, TableFloor floor);

    RestaurantTable getTableById(Long id);

    RestaurantTable getTableByQrToken(String qrToken);

    List<RestaurantTable> getAllTables();

    List<RestaurantTable> getTablesByFloor(TableFloor floor);

    RestaurantTable updateTableStatus(Long id, TableStatus status);

    RestaurantTable updateTable(Long id, String tableNumber, int capacity, TableFloor floor);

    void deleteTable(Long id);

    String generateQrToken(Long tableId);
}
