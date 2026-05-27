package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.repository.CartRepository;   // ⭐ 修正：原本寫成 CartItemRepository
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

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * CartController 單元測試
 * 重點：加入購物車的庫存檢查
 */
@DisplayName("購物車控制器測試")
class CartControllerTest {

    @Mock private CartRepository    cartRepo;
    @Mock private UserRepository    userRepo;
    @Mock private ProductRepository productRepo;
    @Mock private JwtUtil           jwtUtil;

    private CartController cartController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        cartController = new CartController();
        ReflectionTestUtils.setField(cartController, "cartRepo",    cartRepo);
        ReflectionTestUtils.setField(cartController, "userRepo",    userRepo);
        ReflectionTestUtils.setField(cartController, "productRepo", productRepo);
        ReflectionTestUtils.setField(cartController, "jwtUtil",     jwtUtil);
    }

    /** 組裝 addToCart 用的 body */
    private Map<String, Object> body(long productId, int qty) {
        Map<String, Object> m = new HashMap<>();
        m.put("productId", productId);
        m.put("qty",       qty);
        return m;
    }

    @Test
    @DisplayName("加入購物車：庫存不足應回傳 400")
    void addToCart_insufficientStock_shouldReturn400() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User alice = new User();
        alice.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(alice));

        Product product = new Product();
        product.setId(1L);
        product.setTitle("Java 21");
        product.setStock(2);     // 只剩 2 本
        product.setActive(true);
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(cartRepo.findByUserUsernameAndProductId("alice", 1L))
            .thenReturn(Optional.empty());

        // 加入 5 本（超過庫存）
        ResponseEntity<?> response = cartController.addToCart("Bearer token", body(1L, 5));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("庫存不足"));
        verify(cartRepo, never()).save(any());
    }

    @Test
    @DisplayName("加入購物車：停售商品應拒絕")
    void addToCart_inactiveProduct_shouldReject() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        User alice = new User();
        alice.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(alice));

        Product product = new Product();
        product.setId(1L);
        product.setTitle("Java 21");
        product.setStock(100);
        product.setActive(false); // 停售
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));

        ResponseEntity<?> response = cartController.addToCart("Bearer token", body(1L, 1));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("停售"));
        verify(cartRepo, never()).save(any());
    }

    @Test
    @DisplayName("加入購物車：未登入（沒帶 Authorization Header）應回傳 401")
    void addToCart_noAuth_shouldReturn401() {
        // 沒有 Bearer header → extractUsername 回傳 null
        ResponseEntity<?> response = cartController.addToCart(null, body(1L, 1));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
