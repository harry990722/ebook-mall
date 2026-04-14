package com.example.demo.controller;

import com.example.demo.model.Product;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin
public class ProductController {

    // ===== 商品資料（假資料）=====
    List<Product> products = new ArrayList<>();

    // ===== 購物車 =====
    List<Product> cart = new ArrayList<>();

    public ProductController() {
        products.add(new Product(1, "Java 入門", "張小明", 299));
        products.add(new Product(2, "Spring Boot 實戰", "王大明", 399));
        products.add(new Product(3, "前端開發指南", "李小華", 199));
    }

    // 🔥 這個你缺少的！！
    @GetMapping("/products")
    public List<Product> getProducts() {
        return products;
    }

    // 🔥 這個你也缺少！！
    @GetMapping("/products/{id}")
    public Product getProduct(@PathVariable int id) {
        for (Product p : products) {
            if (p.getId() == id) {
                return p;
            }
        }
        return null;
    }

    // ===== 購物車 API =====
    @PostMapping("/cart")
    public String addCart(@RequestBody Product product) {
        cart.add(product);
        return "加入成功";
    }

    @GetMapping("/cart")
    public List<Product> getCart() {
        return cart;
    }

    @DeleteMapping("/cart/{index}")
    public String deleteCart(@PathVariable int index) {
        if (index >= 0 && index < cart.size()) {
            cart.remove(index);
        }
        return "刪除成功";
    }

    @DeleteMapping("/cart/clear")
    public String clearCart() {
        cart.clear();
        return "已清空購物車";
    }
}