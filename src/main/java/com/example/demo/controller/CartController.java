package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.demo.model.CartItem;
import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Tag(name = "購物車", description = "購物車查詢、新增、更新數量、刪除（需登入）")
@SecurityRequirement(name = "bearerAuth")
@RestController
@CrossOrigin
@RequestMapping("/cart")
public class CartController {

    @Autowired private CartRepository    cartRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private UserRepository    userRepo;
    @Autowired private JwtUtil           jwtUtil;

    private String extractUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return jwtUtil.getUsernameFromToken(authHeader.substring(7));
    }

    // ⭐ 取得購物車
    @Operation(summary = "取得購物車", description = "回傳當前登入使用者的購物車內容")
    @GetMapping
    public ResponseEntity<?> getCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    // ⭐ 加入 / 更新購物車
    @Operation(summary = "加入購物車", description = "body 需包含 productId 和 qty，已有相同商品則累加數量（上限 99）")
    @PostMapping
    public ResponseEntity<?> addToCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        Long productId = Long.valueOf(body.get("productId").toString());
        int  qty       = Integer.parseInt(body.getOrDefault("qty", 1).toString());

        User    user    = userRepo.findByUsername(username).orElse(null);
        Product product = productRepo.findById(productId).orElse(null);
        if (user == null || product == null)
            return ResponseEntity.badRequest().body("商品不存在");

        CartItem item = cartRepo.findByUserUsernameAndProductId(username, productId)
            .orElseGet(() -> { CartItem c = new CartItem(); c.setUser(user); c.setProduct(product); return c; });

        item.setQty(Math.min(item.getQty() + qty, 99));
        cartRepo.save(item);
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    // ⭐ 更新數量
    @Operation(summary = "更新數量", description = "qty <= 0 時自動刪除該項目")
    @PutMapping("/{productId}")
    public ResponseEntity<?> updateQty(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        int qty = body.getOrDefault("qty", 1);
        CartItem item = cartRepo.findByUserUsernameAndProductId(username, productId).orElse(null);
        if (item == null)
            return ResponseEntity.notFound().build();

        if (qty <= 0) {
            cartRepo.delete(item);
        } else {
            item.setQty(qty);
            cartRepo.save(item);
        }
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    // ⭐ 刪除單項
    @Operation(summary = "移除單項", description = "從購物車移除指定商品")
    @Transactional
    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long productId) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        cartRepo.deleteByUserUsernameAndProductId(username, productId);
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    // ⭐ 清空購物車（結帳後呼叫）
    @Operation(summary = "清空購物車", description = "移除該使用者購物車內所有商品")
    @Transactional
    @DeleteMapping
    public ResponseEntity<?> clearCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        cartRepo.deleteByUserUsername(username);
        return ResponseEntity.ok("購物車已清空");
    }

    // 轉換成前端用的格式
    private List<Map<String, Object>> toDto(List<CartItem> items) {
        return items.stream().map(i -> Map.<String, Object>of(
            "productId", i.getProduct().getId(),
            "title",     i.getProduct().getTitle(),
            "price",     i.getProduct().getPrice(),
            "imageUrl",  i.getProduct().getImageUrl() != null ? i.getProduct().getImageUrl() : "",
            "qty",       i.getQty()
        )).toList();
    }
}
