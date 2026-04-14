package com.example.demo.controller;

import com.example.demo.model.Order;
import com.example.demo.model.User;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.demo.model.OrderItem;

@RestController
@CrossOrigin
public class OrderController {

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private UserRepository userRepo;

    // ⭐ 建立訂單
    // ⭐ 建立訂單 (更新版本)
    @PostMapping("/order")
    public Order createOrder(@RequestBody Order order) {

        // 1. 從前端拿 username 並關聯 User
        String username = order.getUsername();
        User user = userRepo.findByUsername(username).orElse(null);
        if (user != null) {
            order.setUser(user);
        }

        // 2. 設定訂單初始狀態
        order.setStatus("pending");

        // 3. ⭐ 關鍵：建立雙向關聯
        // 必須讓每個 OrderItem 知道它屬於哪一個 Order，資料庫才能正確寫入外鍵 (order_id)
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                item.setOrder(order);
            }
        }

        // 4. 儲存訂單（因為 Order 設有 CascadeType.ALL，也會一併儲存 OrderItems）
        return orderRepo.save(order);
    }


    // ⭐ 付款
    @PutMapping("/order/pay/{id}")
    public Order payOrder(@PathVariable Long id) {

        Order order = orderRepo.findById(id).orElse(null);

        if (order != null) {
            order.setStatus("paid");
            return orderRepo.save(order);
        }

        return null;
    }
    @GetMapping("/my-orders")
    public List<Order> getMyOrders(@RequestParam String username) {
        return orderRepo.findByUserUsername(username);
    }
}