package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ProductController 單元測試
 * 重點：權限驗證、商品狀態切換
 */
@DisplayName("商品控制器測試")
class ProductControllerTest {

    @Mock private ProductRepository   productRepo;
    @Mock private OrderItemRepository orderItemRepo;
    @Mock private JwtUtil             jwtUtil;

    private ProductController productController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        productController = new ProductController();
        ReflectionTestUtils.setField(productController, "productRepo",   productRepo);
        ReflectionTestUtils.setField(productController, "orderItemRepo", orderItemRepo);
        ReflectionTestUtils.setField(productController, "jwtUtil",       jwtUtil);
    }

    @Test
    @DisplayName("新增商品：非 admin 應回傳 401")
    void createProduct_notAdmin_shouldReturn401() {
        when(jwtUtil.getRoleFromToken(any())).thenReturn("user"); // 一般使用者

        Product product = new Product();
        product.setTitle("新書");
        product.setPrice(300);

        // ⭐ 方法名是 createProduct（原本測試寫的 addProduct 不存在）
        ResponseEntity<?> response = productController.createProduct("Bearer token", product);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(productRepo, never()).save(any());
    }

    @Test
    @DisplayName("新增商品：admin 應可成功新增")
    void createProduct_admin_shouldSucceed() {
        when(jwtUtil.getRoleFromToken(any())).thenReturn("admin");
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product product = new Product();
        product.setTitle("新書");
        product.setPrice(300);

        ResponseEntity<?> response = productController.createProduct("Bearer token", product);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(productRepo).save(any());
    }

    @Test
    @DisplayName("切換商品狀態：應將 active 反轉")
    void toggleProduct_shouldFlipStatus() {
        when(jwtUtil.getRoleFromToken(any())).thenReturn("admin");

        Product product = new Product();
        product.setId(1L);
        product.setActive(true);  // 原本為上架
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // ⭐ 方法名是 toggleProduct（原本測試寫的 toggleActive 不存在）
        productController.toggleProduct("Bearer token", 1L);

        // 應變為停售
        verify(productRepo).save(argThat(p -> !p.isActive()));
    }

    @Test
    @DisplayName("切換商品狀態：非 admin 應回傳 401")
    void toggleProduct_notAdmin_shouldReturn401() {
        when(jwtUtil.getRoleFromToken(any())).thenReturn("user");

        ResponseEntity<?> response = productController.toggleProduct("Bearer token", 1L);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(productRepo, never()).save(any());
    }
}
