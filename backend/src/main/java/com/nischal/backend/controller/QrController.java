package com.nischal.backend.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/qr")
@RequiredArgsConstructor
public class QrController {

    private final RestaurantTableRepository tableRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Generate and return a QR code PNG image for a given table.
     * The QR encodes the URL: {frontendUrl}/order?table={qrToken}
     */
    @GetMapping(value = "/table/{tableId}", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<byte[]> generateQrForTable(@PathVariable Long tableId,
                                                      @RequestParam(defaultValue = "300") int size) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + tableId));

        String menuUrl = frontendUrl + "/order?table=" + table.getQrToken();

        try {
            byte[] qrBytes = generateQrPng(menuUrl, size);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(qrBytes);
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Resolve a QR token to table info (used by frontend after QR scan).
     */
    @GetMapping("/resolve/{qrToken}")
    public ResponseEntity<Map<String, Object>> resolveQrToken(@PathVariable String qrToken) {
        RestaurantTable table = tableRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid QR code"));

        Map<String, Object> response = new HashMap<>();
        response.put("tableId", table.getId());
        response.put("tableNumber", table.getTableNumber());
        response.put("floor", table.getFloor());
        response.put("capacity", table.getCapacity());
        response.put("status", table.getStatus());
        return ResponseEntity.ok(response);
    }

    private byte[] generateQrPng(String content, int size) throws WriterException, IOException {
        QRCodeWriter writer = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 2);

        BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        return outputStream.toByteArray();
    }
}
