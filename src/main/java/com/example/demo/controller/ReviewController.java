package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.demo.model.Review;
import com.example.demo.model.User;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Tag(name = "商品評論", description = "查看、新增、刪除評論")
@RestController
@CrossOrigin
public class ReviewController {

    @Autowired private ReviewRepository reviewRepo;
    @Autowired private UserRepository   userRepo;
    @Autowired private JwtUtil          jwtUtil;

    private String extractUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return jwtUtil.getUsernameFromToken(authHeader.substring(7));
    }

    // ⭐ 取得某商品的所有評論 + 平均評分
    @Operation(summary = "取得商品評論", description = "回傳評論列表、平均評分、評論數")
    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<?> getReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewRepo.findByProductIdOrderByCreatedAtDesc(productId);
        Double avg = reviewRepo.avgRatingByProductId(productId);
        return ResponseEntity.ok(Map.of(
            "reviews", reviews,
            "avgRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "count", reviews.size()
        ));
    }

    // ⭐ 新增評論（需登入，每人每本只能評一次）
    @Operation(summary = "新增評論", description = "需登入，每人每本限評一次，rating 範圍 1~5")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<?> addReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long productId,
            @RequestBody Review review) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入才能評論");

        if (reviewRepo.existsByProductIdAndUsername(productId, username))
            return ResponseEntity.badRequest().body("您已評論過這本書");

        if (review.getRating() < 1 || review.getRating() > 5)
            return ResponseEntity.badRequest().body("評分需在 1~5 之間");

        if (review.getContent() == null || review.getContent().trim().isEmpty())
            return ResponseEntity.badRequest().body("評論內容不能為空");

        User user = userRepo.findByUsername(username).orElse(null);

        review.setProductId(productId);
        review.setUsername(username);
        review.setUser(user);
        review.setContent(review.getContent().trim());

        return ResponseEntity.ok(reviewRepo.save(review));
    }

    // ⭐ 刪除評論（只能刪自己的，或 admin 可刪任何）
    @Operation(summary = "刪除評論", description = "需登入，只能刪自己的評論；admin 可刪任意評論")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        Review review = reviewRepo.findById(id).orElse(null);
        if (review == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("找不到評論");

        String role = jwtUtil.getRoleFromToken(authHeader.substring(7));
        if (!"admin".equals(role) && !review.getUsername().equals(username))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("無權限刪除此評論");

        reviewRepo.deleteById(id);
        return ResponseEntity.ok("刪除成功");
    }
}
