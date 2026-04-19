package com.nischal.backend.controller;

import com.nischal.backend.dto.table.CreateTableRequest;
import com.nischal.backend.dto.table.TableResponse;
import com.nischal.backend.dto.table.UpdateTableRequest;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    /**
     * Get all active tables. Accessible by any authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<TableResponse>> getAllTables() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    /**
     * Get tables filtered by floor. Accessible by any authenticated user.
     */
    @GetMapping("/floor/{floor}")
    public ResponseEntity<List<TableResponse>> getTablesByFloor(@PathVariable TableFloor floor) {
        return ResponseEntity.ok(tableService.getTablesByFloor(floor));
    }

    /**
     * Get available tables for a specific date/time/party size.
     * Accessible by any authenticated user (customers use this to search).
     */
    @GetMapping("/available")
    public ResponseEntity<List<TableResponse>> getAvailableTables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(defaultValue = "1") Integer partySize
    ) {
        return ResponseEntity.ok(tableService.getAvailableTables(date, startTime, endTime, partySize));
    }

    /**
     * Get available tables for a specific floor + date/time/party size.
     */
    @GetMapping("/available/floor/{floor}")
    public ResponseEntity<List<TableResponse>> getAvailableTablesByFloor(
            @PathVariable TableFloor floor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(defaultValue = "1") Integer partySize
    ) {
        return ResponseEntity.ok(tableService.getAvailableTablesByFloor(date, startTime, endTime, partySize, floor));
    }

    /**
     * Get a single table by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TableResponse> getTableById(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.getTableById(id));
    }

    // Admin-only operations

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<TableResponse> createTable(@Valid @RequestBody CreateTableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createTable(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<TableResponse> updateTable(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTableRequest request
    ) {
        return ResponseEntity.ok(tableService.updateTable(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.noContent().build();
    }
}
