package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * OrderController 單元測試
 * 重點：庫存扣減、訂單取消還原庫存、權限驗證
 */
@DisplayName("訂單控制器測試")
class OrderControllerTest {

    @Mock private OrderRepository   orderRepo;
    @Mock private UserRepository    userRepo;
    @Mock private ProductRepository productRepo;
    @Mock private JwtUtil           jwtUtil;

    private OrderController orderController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        orderController = new OrderController();
        ReflectionTestUtils.setField(orderController, "orderRepo",   orderRepo);
        ReflectionTestUtils.setField(orderController, "userRepo",    userRepo);
        ReflectionTestUtils.setField(orderController, "productRepo", productRepo);
        ReflectionTestUtils.setField(orderController, "jwtUtil",     jwtUtil);
    }

    private Order buildOrder(String title, int qty, int price) {
        Order order = new Order();
        order.setTotal(qty * price);
        OrderItem item = new OrderItem();
        item.setTitle(title);
        item.setQty(qty);
        item.setPrice(price);
        List<OrderItem> items = new ArrayList<>();
        items.add(item);
        order.setItems(items);
        return order;
    }

    private Product buildProduct(String title, int stock, boolean active) {
        Product p = new Product();
        p.setTitle(title);
        p.setStock(stock);
        p.setActive(active);
        return p;
    }

    /** Order 的 id 是 JPA 自動產生、沒有 public setId，用反射注入測試用 ID */
    private void setOrderId(Order order, Long id) {
        ReflectionTestUtils.setField(order, "id", id);
    }

    @Test
    @DisplayName("建立訂單：未登入應回傳 401")
    void createOrder_noAuth_shouldReturn401() {
        // authHeader 為 null → extractUsername 回傳 null → 401
        Order order = buildOrder("Java 21", 1, 450);
        ResponseEntity<?> response = orderController.createOrder(null, order);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("建立訂單：庫存不足應回傳 400")
    void createOrder_insufficientStock_shouldReturn400() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User user = new User();
        user.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));

        // 商品庫存只有 5，但下單要 10
        Product product = buildProduct("Java 21", 5, true);
        when(productRepo.findAll()).thenReturn(Arrays.asList(product));

        Order order = buildOrder("Java 21", 10, 450);
        ResponseEntity<?> response = orderController.createOrder("Bearer token", order);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("庫存不足"));
        verify(orderRepo, never()).save(any());
    }

    @Test
    @DisplayName("建立訂單：成功時應扣減庫存")
    void createOrder_success_shouldDeductStock() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User user = new User();
        user.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));

        Product product = buildProduct("Java 21", 50, true);
        when(productRepo.findAll()).thenReturn(Arrays.asList(product));
        when(orderRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Order order = buildOrder("Java 21", 3, 450);
        orderController.createOrder("Bearer token", order);

        // 庫存應從 50 變成 47
        verify(productRepo).save(argThat(p -> p.getStock() == 47));
    }

    @Test
    @DisplayName("建立訂單:停售商品應拒絕")
    void createOrder_inactiveProduct_shouldReject() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User user = new User();
        user.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));

        Product product = buildProduct("Java 21", 100, false); // active=false
        when(productRepo.findAll()).thenReturn(Arrays.asList(product));

        Order order = buildOrder("Java 21", 1, 450);
        ResponseEntity<?> response = orderController.createOrder("Bearer token", order);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("停售"));
    }

    @Test
    @DisplayName("取消訂單：已付款狀態不能取消")
    void cancelOrder_paidStatus_shouldReturn400() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User user = new User();
        user.setUsername("alice");

        Order order = new Order();
        setOrderId(order, 1L);    // ⭐ 用反射注入，Order 沒有 setId
        order.setUser(user);
        order.setStatus("paid");  // 已付款

        when(orderRepo.findById(1L)).thenReturn(Optional.of(order));

        ResponseEntity<?> response = orderController.cancelOrder("Bearer token", 1L);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("無法取消"));
    }

    @Test
    @DisplayName("取消訂單：成功時應還原庫存")
    void cancelOrder_success_shouldRestoreStock() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User user = new User();
        user.setUsername("alice");

        OrderItem item = new OrderItem();
        item.setTitle("Java 21");
        item.setQty(5);

        Order order = new Order();
        setOrderId(order, 1L);    // ⭐ 用反射注入
        order.setUser(user);
        order.setStatus("pending");
        order.setItems(Arrays.asList(item));

        Product product = buildProduct("Java 21", 45, true);

        when(orderRepo.findById(1L)).thenReturn(Optional.of(order));
        when(productRepo.findAll()).thenReturn(Arrays.asList(product));
        when(orderRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        orderController.cancelOrder("Bearer token", 1L);

        // 庫存應從 45 還原為 50（5+45）
        verify(productRepo).save(argThat(p -> p.getStock() == 50));
    }

    @Test
    @DisplayName("取消訂單：他人的訂單應回傳 403")
    void cancelOrder_otherUser_shouldReturn403() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User bob = new User();
        bob.setUsername("bob");

        Order order = new Order();
        setOrderId(order, 1L);    // ⭐ 用反射注入
        order.setUser(bob);
        order.setStatus("pending");

        when(orderRepo.findById(1L)).thenReturn(Optional.of(order));

        ResponseEntity<?> response = orderController.cancelOrder("Bearer token", 1L);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
