package com.nischal.backend.controller;

import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.service.TableService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/qr")
@RequiredArgsConstructor
public class QrController {

    private final TableService tableService;

    @GetMapping(value = "/table/{tableId}", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<byte[]> generateTableQr(
            @PathVariable Long tableId,
            @RequestParam(defaultValue = "300") int size
    ) throws WriterException, IOException {
        RestaurantTable table = tableService.getTableById(tableId);
        String qrContent = "grabEats://table?token=" + table.getQrToken() + "&tableId=" + tableId;

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(qrContent, BarcodeFormat.QR_CODE, size, size);

        ByteArrayOutputStream pngOutput = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutput);
        byte[] pngData = pngOutput.toByteArray();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"table-" + table.getTableNumber() + "-qr.png\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(pngData);
    }
}
