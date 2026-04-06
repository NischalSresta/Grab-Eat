package com.nischal.backend.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalStaff;
    private long totalCustomers;
    private long activeOrders;
    private long totalOrdersToday;
    private long totalMenuItems;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;
    private long lowStockAlerts;
}
