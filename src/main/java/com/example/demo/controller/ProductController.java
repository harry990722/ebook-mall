package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import com.example.demo.util.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productRepo.findAll();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        return productRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/products")
    public ResponseEntity<?> createProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Product product) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        return ResponseEntity.ok(productRepo.save(product));
    }

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
