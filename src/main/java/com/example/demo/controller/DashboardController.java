package com.example.demo.controller;

import com.example.demo.model.Order;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@Tag(name = "後台儀表板", description = "Dashboard 統計數據")
@SecurityRequirement(name = "bearerAuth")
@RestController
@CrossOrigin
@RequestMapping("/admin/dashboard")
public class DashboardController {

    @Autowired private OrderRepository     orderRepo;
    @Autowired private ProductRepository   productRepo;
    @Autowired private UserRepository      userRepo;
    @Autowired private OrderItemRepository orderItemRepo;
    @Autowired private com.example.demo.repository.MessageRepository messageRepo; // ⭐ 留言
    @Autowired private JwtUtil             jwtUtil;

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        return "admin".equals(jwtUtil.getRoleFromToken(authHeader.substring(7)));
    }

    // ⭐ 取得儀表板統計總覽
    @Operation(summary = "Dashboard 統計", description = "回傳所有儀表板需要的統計數據")
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        List<Order> allOrders = orderRepo.findAll();

        // ===== 基礎統計 =====
        long totalProducts  = productRepo.count();
        long activeProducts = productRepo.findByActiveTrue().size();
        long totalOrders    = allOrders.size();
        long totalUsers     = userRepo.count();

        // ⭐ 缺貨 / 低庫存統計
        long outOfStock = productRepo.findAll().stream()
            .filter(p -> p.getStock() == 0 && p.isActive())
            .count();
        long lowStock = productRepo.findAll().stream()
            .filter(p -> p.getStock() > 0 && p.getStock() < 10 && p.isActive())
            .count();

        // ⭐ 待處理留言數
        long pendingMessages = messageRepo.countByStatus("pending");

        // ===== 訂單狀態統計 =====
        Map<String, Long> statusCount = allOrders.stream()
            .collect(Collectors.groupingBy(
                o -> o.getStatus() == null ? "unknown" : o.getStatus(),
                Collectors.counting()
            ));

        // 待處理 = pending + processing
        long pendingCount    = statusCount.getOrDefault("pending", 0L) + statusCount.getOrDefault("processing", 0L);

        // ===== 總營收（排除已取消和待付款） =====
        long totalRevenue = allOrders.stream()
            .filter(o -> {
                String s = o.getStatus();
                return s != null && !"cancelled".equals(s) && !"pending".equals(s);
            })
            .mapToLong(Order::getTotal)
            .sum();

        // ===== 最近 5 筆訂單 =====
        List<Map<String, Object>> recentOrders = allOrders.stream()
            .sorted((a, b) -> Long.compare(b.getId(), a.getId())) // 由新到舊
            .limit(5)
            .map(o -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id",         o.getId());
                m.put("name",       o.getName());
                m.put("total",      o.getTotal());
                m.put("status",     o.getStatus());
                m.put("createdAt",  o.getCreatedAt());
                return m;
            })
            .toList();

        // ===== 銷售排行 Top 5 =====
        List<Object[]> topRows = orderItemRepo.findTopSellingProducts(PageRequest.of(0, 5));
        List<Map<String, Object>> topSelling = new ArrayList<>();
        for (int i = 0; i < topRows.size(); i++) {
            Object[] row = topRows.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("rank",         i + 1);
            item.put("title",        row[0]);
            item.put("totalQty",     ((Number) row[1]).longValue());
            item.put("totalRevenue", ((Number) row[2]).longValue());
            topSelling.add(item);
        }

        // ===== 組合回傳 =====
        Map<String, Object> result = new HashMap<>();
        result.put("totalProducts",  totalProducts);
        result.put("activeProducts", activeProducts);
        result.put("totalOrders",    totalOrders);
        result.put("totalUsers",     totalUsers);
        result.put("totalRevenue",   totalRevenue);
        result.put("pendingCount",   pendingCount);
        result.put("outOfStock",     outOfStock);
        result.put("lowStock",       lowStock);
        result.put("pendingMessages", pendingMessages);
        result.put("statusCount",    statusCount);
        result.put("recentOrders",   recentOrders);
        result.put("topSelling",     topSelling);

        return ResponseEntity.ok(result);
    }
}
