package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import com.example.demo.util.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

@Tag(name = "商品管理", description = "商品查詢與後台 CRUD")
@RestController
@CrossOrigin
public class ProductController {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private JwtUtil jwtUtil; // ⭐ 改用注入

    @PostConstruct
    public void init() {
        if (productRepo.count() > 0) return;
        productRepo.save(new Product("Java 21 程式開發實戰", "張小明", 450, "tech"));
        productRepo.save(new Product("Spring Boot 3 核心技術", "王大同", 520, "tech"));
        productRepo.save(new Product("現代前端框架開發指南", "李小華", 380, "tech"));
        productRepo.save(new Product("微服務架構設計與實踐", "林志強", 600, "tech"));
        productRepo.save(new Product("Docker + Kubernetes 雲端部署", "黃大牛", 480, "tech"));
        productRepo.save(new Product("Python 資料科學入門", "趙小雲", 350, "tech"));
        productRepo.save(new Product("致富心態：掌握財富心理", "摩根·豪瑟", 320, "business"));
        productRepo.save(new Product("原子習慣：細微改變帶來巨大成就", "詹姆斯·克利爾", 280, "mind"));
        productRepo.save(new Product("深度工作力：在淺薄時代生存", "卡爾·紐波特", 300, "mind"));
        productRepo.save(new Product("原則：生活與工作", "雷·達里歐", 450, "business"));
        productRepo.save(new Product("思考的藝術：52個邏輯錯誤", "魯爾夫．多伯里", 250, "mind"));
        productRepo.save(new Product("快思慢想：思考的捷徑", "丹尼爾·康納曼", 400, "mind"));
    }

    // ⭐ 前台：分頁查詢（預設每頁 8 筆，只回傳上架商品）
    @Operation(summary = "取得商品列表", description = "支援分頁、類別篩選、關鍵字搜尋，只回傳上架商品")
    @GetMapping("/products")
    public ResponseEntity<?> getProducts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "8")  int size,
            @RequestParam(defaultValue = "")   String type,
            @RequestParam(defaultValue = "")   String keyword) {

        List<Product> all = productRepo.findByActiveTrue();

        // 類別篩選
        if (!type.isEmpty())
            all = all.stream().filter(p -> type.equals(p.getType())).toList();

        // 關鍵字搜尋（書名 + 作者）
        if (!keyword.isEmpty()) {
            String kw = keyword.toLowerCase();
            all = all.stream().filter(p ->
                p.getTitle().toLowerCase().contains(kw) ||
                (p.getAuthor() != null && p.getAuthor().toLowerCase().contains(kw))
            ).toList();
        }

        int total     = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIdx   = Math.min(page * size, total);
        int toIdx     = Math.min(fromIdx + size, total);
        List<Product> pageData = all.subList(fromIdx, toIdx);

        return ResponseEntity.ok(Map.of(
            "content",     pageData,
            "totalPages",  totalPages,
            "totalItems",  total,
            "currentPage", page
        ));
    }

    // ⭐ 後台：回傳所有商品（含停售）
    @Operation(summary = "【後台】取得所有商品（含停售）", description = "需 admin 權限")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/admin/products/all")
    public ResponseEntity<?> getAllProducts(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");
        return ResponseEntity.ok(productRepo.findAll());
    }

    @Operation(summary = "取得單一商品", description = "依 ID 查詢商品詳細資料")
    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        return productRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "【後台】新增商品", description = "需 admin 權限")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/admin/products")
    public ResponseEntity<?> createProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Product product) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        return ResponseEntity.ok(productRepo.save(product));
    }

    @Operation(summary = "【後台】編輯商品", description = "需 admin 權限")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/products/{id}")
    public ResponseEntity<?> updateProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Product updated) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        return productRepo.findById(id).map(p -> {
            p.setTitle(updated.getTitle());
            p.setAuthor(updated.getAuthor());
            p.setPrice(updated.getPrice());
            p.setType(updated.getType());
            p.setImageUrl(updated.getImageUrl()); // ⭐ 圖片 URL
            return ResponseEntity.ok(productRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ⭐ 切換上架 / 停售狀態
    @Operation(summary = "【後台】切換上架/停售", description = "需 admin 權限，true = 上架，false = 停售")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/products/{id}/toggle")
    public ResponseEntity<?> toggleProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");
        return productRepo.findById(id).map(p -> {
            p.setActive(!p.isActive());
            return ResponseEntity.ok(productRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "【後台】刪除商品", description = "需 admin 權限，永久刪除")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<?> deleteProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        if (!productRepo.existsById(id))
            return ResponseEntity.notFound().build();
        productRepo.deleteById(id);
        return ResponseEntity.ok("刪除成功");
    }

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        String token = authHeader.substring(7);
        return "admin".equals(jwtUtil.getRoleFromToken(token));
    }
}
