package com.nischal.backend.controller;

import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;
import com.nischal.backend.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<List<RestaurantTable>> getAllTables() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTable> getTableById(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.getTableById(id));
    }

    @GetMapping("/floor/{floor}")
    public ResponseEntity<List<RestaurantTable>> getTablesByFloor(@PathVariable TableFloor floor) {
        return ResponseEntity.ok(tableService.getTablesByFloor(floor));
    }

    @GetMapping("/qr/{token}")
    public ResponseEntity<RestaurantTable> getTableByQrToken(@PathVariable String token) {
        return ResponseEntity.ok(tableService.getTableByQrToken(token));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<RestaurantTable> createTable(@RequestBody Map<String, Object> request) {
        String tableNumber = (String) request.get("tableNumber");
        int capacity = (int) request.get("capacity");
        TableFloor floor = TableFloor.valueOf((String) request.get("floor"));
        return ResponseEntity.ok(tableService.createTable(tableNumber, capacity, floor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<RestaurantTable> updateTable(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        String tableNumber = (String) request.get("tableNumber");
        int capacity = (int) request.get("capacity");
        TableFloor floor = TableFloor.valueOf((String) request.get("floor"));
        return ResponseEntity.ok(tableService.updateTable(id, tableNumber, capacity, floor));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<RestaurantTable> updateTableStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        TableStatus status = TableStatus.valueOf(request.get("status"));
        return ResponseEntity.ok(tableService.updateTableStatus(id, status));
    }

    @PostMapping("/{id}/regenerate-qr")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<Map<String, String>> regenerateQr(@PathVariable Long id) {
        String token = tableService.generateQrToken(id);
        return ResponseEntity.ok(Map.of("qrToken", token));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok(Map.of("message", "Table deleted successfully"));
    }
}
