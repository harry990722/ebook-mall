package com.example.demo.controller;

import com.example.demo.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Tag(name = "Banner 管理", description = "首頁輪播 Banner 查詢與管理")
@RestController
@CrossOrigin
public class BannerController {

    @Autowired
    private JwtUtil jwtUtil;

    // ⭐ 用 List 模擬資料庫（若要持久化可改成 @Entity）
    private final List<Map<String, Object>> banners = new ArrayList<>();
    private final AtomicLong idSeq = new AtomicLong(1);

    @PostConstruct
    public void init() {
        Map<String, Object> b1 = new java.util.HashMap<>();
        b1.put("id",       idSeq.getAndIncrement());
        b1.put("imageUrl", "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=80");
        b1.put("title",    "📚 電子書商城精選好書");
        b1.put("subtitle", "技術・商業・心理學，每本都是你的競爭力");
        b1.put("active",   true);
        banners.add(b1);

        Map<String, Object> b2 = new java.util.HashMap<>();
        b2.put("id",       idSeq.getAndIncrement());
        b2.put("imageUrl", "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=1400&q=80");
        b2.put("title",    "🆕 本週新書上架");
        b2.put("subtitle", "每週精選更新，知識就是競爭力");
        b2.put("active",   true);
        banners.add(b2);

        Map<String, Object> b3 = new java.util.HashMap<>();
        b3.put("id",       idSeq.getAndIncrement());
        b3.put("imageUrl", "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1400&q=80");
        b3.put("title",    "🔥 限時 79 折優惠");
        b3.put("subtitle", "精選書籍限時特惠，錯過再等一年");
        b3.put("active",   true);
        banners.add(b3);
    }

    // ⭐ 前台：取得所有上架 Banner
    @Operation(summary = "取得 Banner 列表", description = "只回傳 active=true 的 Banner")
    @GetMapping("/banners")
    public List<Map<String, Object>> getBanners() {
        return banners.stream()
            .filter(b -> Boolean.TRUE.equals(b.get("active")))
            .toList();
    }

    // ⭐ 後台：取得全部 Banner（含未上架）
    @Operation(summary = "【後台】取得全部 Banner")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/admin/banners")
    public ResponseEntity<?> getAllBanners(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");
        return ResponseEntity.ok(banners);
    }

    // ⭐ 後台：新增 Banner
    @Operation(summary = "【後台】新增 Banner")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/admin/banners")
    public ResponseEntity<?> addBanner(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        Map<String, Object> banner = new java.util.HashMap<>(body);
        banner.put("id",     idSeq.getAndIncrement());
        banner.put("active", true);
        banners.add(banner);
        return ResponseEntity.ok(banner);
    }

    // ⭐ 後台：刪除 Banner
    @Operation(summary = "【後台】刪除 Banner")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/admin/banners/{id}")
    public ResponseEntity<?> deleteBanner(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        boolean removed = banners.removeIf(b -> id.equals(Long.valueOf(b.get("id").toString())));
        return removed ? ResponseEntity.ok("刪除成功") : ResponseEntity.notFound().build();
    }

    // ⭐ 後台：切換上架/下架
    @Operation(summary = "【後台】切換 Banner 狀態")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/banners/{id}/toggle")
    public ResponseEntity<?> toggleBanner(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        return banners.stream()
            .filter(b -> id.equals(Long.valueOf(b.get("id").toString())))
            .findFirst()
            .map(b -> {
                Map<String, Object> updated = new java.util.HashMap<>(b);
                updated.put("active", !Boolean.TRUE.equals(b.get("active")));
                banners.set(banners.indexOf(b), updated);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        return "admin".equals(jwtUtil.getRoleFromToken(authHeader.substring(7)));
    }
}
