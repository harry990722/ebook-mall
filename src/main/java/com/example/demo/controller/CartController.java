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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "購物車", description = "購物車查詢、新增、更新數量、刪除、合併（需登入）")
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
        try {
            return jwtUtil.getUsernameFromToken(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }

    @Operation(summary = "取得購物車")
    @GetMapping
    public ResponseEntity<?> getCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    @Operation(summary = "加入購物車")
    @PostMapping
    @Transactional
    public ResponseEntity<?> addToCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        if (body == null || body.get("productId") == null)
            return ResponseEntity.badRequest().body("缺少 productId");

        Long productId;
        int qty;
        try {
            productId = Long.valueOf(body.get("productId").toString());
            qty = Integer.parseInt(body.getOrDefault("qty", 1).toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("productId 或 qty 格式錯誤");
        }

        User    user    = userRepo.findByUsername(username).orElse(null);
        Product product = productRepo.findById(productId).orElse(null);
        if (user == null || product == null)
            return ResponseEntity.badRequest().body("商品不存在");

        if (!product.isActive())
            return ResponseEntity.badRequest().body("商品已停售");

        CartItem item = cartRepo.findByUserUsernameAndProductId(username, productId)
            .orElseGet(() -> { CartItem c = new CartItem(); c.setUser(user); c.setProduct(product); return c; });

        int newQty = Math.min(item.getQty() + qty, 99);
        if (product.getStock() < newQty)
            return ResponseEntity.badRequest().body("庫存不足，目前剩餘：" + product.getStock());

        item.setQty(newQty);
        cartRepo.save(item);
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    /**
     * ⭐ 合併本地（訪客）購物車到後端
     *    Request body: { "items": [{ "productId": 1, "qty": 2 }, ...] }
     *    合併規則：相同 productId 取「較大」數量，不是相加（避免重複登入造成數量爆增）
     */
    @Operation(summary = "合併本地購物車", description = "登入後將訪客時加的本地購物車合併進後端，相同商品取較大數量")
    @PostMapping("/merge")
    @Transactional
    public ResponseEntity<?> mergeCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("使用者不存在");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> incoming = (List<Map<String, Object>>) body.get("items");
        if (incoming == null || incoming.isEmpty()) {
            // 沒東西要合併，直接回現有購物車
            return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
        }

        for (Map<String, Object> entry : incoming) {
            if (entry.get("productId") == null) continue;
            Long productId;
            int incomingQty;
            try {
                productId = Long.valueOf(entry.get("productId").toString());
                incomingQty = Integer.parseInt(entry.getOrDefault("qty", 1).toString());
            } catch (NumberFormatException e) {
                continue;  // 格式錯就跳過這筆
            }
            if (incomingQty <= 0) continue;

            Product product = productRepo.findById(productId).orElse(null);
            if (product == null || !product.isActive()) continue;  // 商品被刪 / 停售：跳過

            CartItem item = cartRepo.findByUserUsernameAndProductId(username, productId)
                .orElseGet(() -> {
                    CartItem c = new CartItem();
                    c.setUser(user);
                    c.setProduct(product);
                    c.setQty(0);
                    return c;
                });

            // ⭐ 合併規則：取較大值（不是相加）
            int mergedQty = Math.max(item.getQty(), incomingQty);
            // 受庫存限制
            mergedQty = Math.min(mergedQty, product.getStock());
            // 受購物車上限限制
            mergedQty = Math.min(mergedQty, 99);

            if (mergedQty > 0) {
                item.setQty(mergedQty);
                cartRepo.save(item);
            }
        }

        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    @Operation(summary = "更新數量")
    @PutMapping("/{productId}")
    @Transactional
    public ResponseEntity<?> updateQty(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        int qty = body == null ? 1 : body.getOrDefault("qty", 1);
        CartItem item = cartRepo.findByUserUsernameAndProductId(username, productId).orElse(null);
        if (item == null)
            return ResponseEntity.notFound().build();

        Product product = productRepo.findById(productId).orElse(null);
        if (product == null) {
            cartRepo.delete(item);
            return ResponseEntity.badRequest().body("商品已下架，已從購物車移除");
        }
        if (qty > 0 && qty > product.getStock())
            return ResponseEntity.badRequest().body("數量超過庫存（僅剩 " + product.getStock() + " 本）");

        if (qty <= 0) {
            cartRepo.delete(item);
        } else {
            item.setQty(qty);
            cartRepo.save(item);
        }
        return ResponseEntity.ok(toDto(cartRepo.findByUserUsername(username)));
    }

    @Operation(summary = "移除單項")
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

    @Operation(summary = "清空購物車")
    @Transactional
    @DeleteMapping
    public ResponseEntity<?> clearCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        cartRepo.deleteByUserUsername(username);
        return ResponseEntity.ok(Map.of("message", "購物車已清空"));
    }

    /**
     * 轉換 CartItem → 前端用的 Map
     * 完整空指標保護：商品被刪自動清理孤兒項目
     */
    private List<Map<String, Object>> toDto(List<CartItem> items) {
        if (items == null) return List.of();

        List<Map<String, Object>> result = new ArrayList<>();
        List<CartItem> orphanItems = new ArrayList<>();

        for (CartItem i : items) {
            Product p = i.getProduct();
            if (p == null) {
                orphanItems.add(i);
                continue;
            }

            Map<String, Object> dto = new HashMap<>();
            dto.put("productId", p.getId());
            dto.put("title",     p.getTitle() != null ? p.getTitle() : "");
            dto.put("price",     p.getPrice());
            dto.put("imageUrl",  p.getImageUrl() != null ? p.getImageUrl() : "");
            dto.put("qty",       i.getQty());
            result.add(dto);
        }

        if (!orphanItems.isEmpty()) {
            cartRepo.deleteAll(orphanItems);
        }

        return result;
    }
}
