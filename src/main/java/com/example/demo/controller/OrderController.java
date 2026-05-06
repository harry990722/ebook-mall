package com.example.demo.controller;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.User;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
public class OrderController {

    @Autowired private OrderRepository orderRepo;
    @Autowired private UserRepository  userRepo;
    @Autowired private JwtUtil         jwtUtil;

    private String extractUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return jwtUtil.getUsernameFromToken(authHeader.substring(7));
    }

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        return "admin".equals(jwtUtil.getRoleFromToken(authHeader.substring(7)));
    }

    // ⭐ 建立訂單
    @PostMapping("/order")
    public ResponseEntity<?> createOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Order order) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");

        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("使用者不存在");

        order.setUser(user);
        order.setUsername(username);
        order.setStatus("pending");

        if (order.getItems() != null)
            for (OrderItem item : order.getItems())
                item.setOrder(order);

        return ResponseEntity.ok(orderRepo.save(order));
    }

    // ⭐ 使用者付款
    @PutMapping("/order/pay/{id}")
    public ResponseEntity<?> payOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");

        Order order = orderRepo.findById(id).orElse(null);
        if (order == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("找不到訂單");

        if (order.getUser() == null || !order.getUser().getUsername().equals(username))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("無權限操作此訂單");

        order.setStatus("paid");
        return ResponseEntity.ok(orderRepo.save(order));
    }

    // ⭐ 使用者取消訂單（只有 pending 才能取消）
    @PutMapping("/order/cancel/{id}")
    public ResponseEntity<?> cancelOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");

        Order order = orderRepo.findById(id).orElse(null);
        if (order == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("找不到訂單");

        if (order.getUser() == null || !order.getUser().getUsername().equals(username))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("無權限操作此訂單");

        if (!"pending".equals(order.getStatus()))
            return ResponseEntity.badRequest().body("只有待付款的訂單可以取消");

        order.setStatus("cancelled");
        return ResponseEntity.ok(orderRepo.save(order));
    }

    // ⭐ 查詢我的訂單
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");

        return ResponseEntity.ok(orderRepo.findByUserUsername(username));
    }

    // ===== 後台管理 API =====

    // ⭐ 後台：取得所有訂單
    @GetMapping("/admin/orders")
    public ResponseEntity<?> getAllOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        return ResponseEntity.ok(orderRepo.findAll());
    }

    // ⭐ 後台：更新訂單狀態
    @PutMapping("/admin/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        String newStatus = body.get("status");
        List<String> valid = List.of("pending", "paid", "shipped", "completed", "cancelled");
        if (!valid.contains(newStatus))
            return ResponseEntity.badRequest().body("無效的狀態值");

        Order order = orderRepo.findById(id).orElse(null);
        if (order == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("找不到訂單");

        order.setStatus(newStatus);
        return ResponseEntity.ok(orderRepo.save(order));
    }
}
