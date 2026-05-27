package com.example.demo.controller;

import com.example.demo.model.Review;
import com.example.demo.model.User;
import com.example.demo.repository.ReviewRepository;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * ReviewController 單元測試
 * 重點：評分範圍、每人每本限一次
 */
@DisplayName("評論控制器測試")
class ReviewControllerTest {

    @Mock private ReviewRepository reviewRepo;
    @Mock private UserRepository   userRepo;
    @Mock private JwtUtil          jwtUtil;

    private ReviewController reviewController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        reviewController = new ReviewController();
        ReflectionTestUtils.setField(reviewController, "reviewRepo", reviewRepo);
        ReflectionTestUtils.setField(reviewController, "userRepo",   userRepo);
        ReflectionTestUtils.setField(reviewController, "jwtUtil",    jwtUtil);
    }

    @Test
    @DisplayName("評論：未登入應回傳 401")
    void addReview_noAuth_shouldReturn401() {
        // authHeader 為 null → extractUsername 回傳 null → 401
        Review review = new Review();
        review.setRating(5);

        // ⭐ 方法名是 addReview，簽章為 (authHeader, productId, review)
        ResponseEntity<?> response = reviewController.addReview(null, 1L, review);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("評論：星數應在 1~5 之間")
    void addReview_invalidRating_shouldReturn400() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");
        // 沒有重複評論
        when(reviewRepo.existsByProductIdAndUsername(anyLong(), anyString()))
            .thenReturn(false);

        Review review = new Review();
        review.setRating(6);  // 超過 5
        review.setContent("不錯");

        ResponseEntity<?> response = reviewController.addReview("Bearer token", 1L, review);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(reviewRepo, never()).save(any());
    }

    @Test
    @DisplayName("評論：每人每本書只能評論一次")
    void addReview_duplicateReview_shouldReturn400() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");

        // ⭐ 用 existsByProductIdAndUsername（Controller 實際呼叫的方法）
        when(reviewRepo.existsByProductIdAndUsername(1L, "alice")).thenReturn(true);

        Review newReview = new Review();
        newReview.setRating(4);
        newReview.setContent("很棒");

        ResponseEntity<?> response = reviewController.addReview("Bearer token", 1L, newReview);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("已評論"));
        verify(reviewRepo, never()).save(any());
    }

    @Test
    @DisplayName("評論：正常情況應儲存成功")
    void addReview_valid_shouldSave() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");
        when(reviewRepo.existsByProductIdAndUsername(1L, "alice")).thenReturn(false);

        User alice = new User();
        alice.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(alice));

        Review review = new Review();
        review.setRating(5);
        review.setContent("好書推薦");

        reviewController.addReview("Bearer token", 1L, review);

        verify(reviewRepo).save(argThat(r ->
            r.getRating() == 5 &&
            r.getProductId() == 1L &&
            "alice".equals(r.getUsername())
        ));
    }

    @Test
    @DisplayName("評論：內容為空應回傳 400")
    void addReview_emptyContent_shouldReturn400() {
        when(jwtUtil.getUsernameFromToken(any())).thenReturn("alice");
        when(reviewRepo.existsByProductIdAndUsername(1L, "alice")).thenReturn(false);

        Review review = new Review();
        review.setRating(5);
        review.setContent("   "); // 只有空白

        ResponseEntity<?> response = reviewController.addReview("Bearer token", 1L, review);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(reviewRepo, never()).save(any());
    }
}
