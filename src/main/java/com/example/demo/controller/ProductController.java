package com.example.demo.controller;

import com.example.demo.model.Product;
import jakarta.annotation.PostConstruct;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin
public class ProductController {

    private List<Product> products = new ArrayList<>();

    // ⭐ 改用 @PostConstruct：Spring 元件初始化完成後才執行，是標準寫法
    @PostConstruct
    public void init() {
        // --- 類別 1: 新書焦點 (ID 1-6) ---
        products.add(new Product(1, "Java 21 程式開發實戰", "張小明", 450));
        products.add(new Product(2, "Spring Boot 3 核心技術", "王大同", 520));
        products.add(new Product(3, "現代前端框架開發指南", "李小華", 380));
        products.add(new Product(4, "微服務架構設計與實踐", "林志強", 600));
        products.add(new Product(5, "Docker + Kubernetes 雲端部署", "黃大牛", 480));
        products.add(new Product(6, "Python 資料科學入門", "趙小雲", 350));

        // --- 類別 2: 主題選讀 (ID 7-12) ---
        products.add(new Product(7, "致富心態：掌握財富心理", "摩根·豪瑟", 320));
        products.add(new Product(8, "原子習慣：細微改變帶來巨大成就", "詹姆斯·克利爾", 280));
        products.add(new Product(9, "深度工作力：在淺薄時代生存", "卡爾·紐波特", 300));
        products.add(new Product(10, "原則：生活與工作", "雷·達里歐", 450));
        products.add(new Product(11, "思考的藝術：52個邏輯錯誤", "魯爾夫．多伯里", 250));
        products.add(new Product(12, "快思慢想：思考的捷徑", "丹尼爾·康納曼", 400));
    }

    @GetMapping("/products")
    public List<Product> getProducts() {
        return products;
    }

    @GetMapping("/products/{id}")
    public Product getProduct(@PathVariable int id) {
        return products.stream().filter(p -> p.getId() == id).findFirst().orElse(null);
    }
}
