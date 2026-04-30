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

@RestController
@CrossOrigin
public class OrderController {

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private UserRepository userRepo;

    // ===== 共用：從 Authorization Header 解析 username =====
    private String extractUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        return JwtUtil.getUsernameFromToken(token); // 無效或過期回傳 null
    }

    // ⭐ 建立訂單
    @PostMapping("/order")
    public ResponseEntity<?> createOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Order order) {

        String username = extractUsername(authHeader);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");
        }

        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("使用者不存在");
        }

        order.setUser(user);
        order.setUsername(username);
        order.setStatus("pending");

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                item.setOrder(order);
            }
        }

        return ResponseEntity.ok(orderRepo.save(order));
    }

    // ⭐ 付款
    @PutMapping("/order/pay/{id}")
    public ResponseEntity<?> payOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        String username = extractUsername(authHeader);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");
        }

        Order order = orderRepo.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("找不到訂單");
        }

        if (order.getUser() == null || !order.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("無權限操作此訂單");
        }

        order.setStatus("paid");
        return ResponseEntity.ok(orderRepo.save(order));
    }

    // ⭐ 查詢我的訂單
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = extractUsername(authHeader);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效，請重新登入");
        }

        List<Order> orders = orderRepo.findByUserUsername(username);
        return ResponseEntity.ok(orders);
    }
}
