package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.model.OrderItem;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin
public class ProductController {

    List<Product> products = new ArrayList<>();
    List<OrderItem> cart = new ArrayList<>();

    public ProductController() {
        products.add(new Product(1, "Java 入門", "張小明", 299));
        products.add(new Product(2, "Spring Boot 實戰", "王大明", 399));
        products.add(new Product(3, "前端開發指南", "李小華", 199));
    }

    @GetMapping("/products")
    public List<Product> getProducts() {
        return products;
    }

    @GetMapping("/products/{id}")
    public Product getProduct(@PathVariable int id) {
        for (Product p : products) {
            if (p.getId() == id) return p;
        }
        return null;
    }

    @PostMapping("/cart")
    public String addCart(@RequestBody OrderItem item) {
        for (OrderItem i : cart) {
            if (i.getTitle().equals(item.getTitle())) {
                i.setQty(i.getQty() + item.getQty());
                return "數量累加成功";
            }
        }
        cart.add(item);
        return "加入成功";
    }

    @GetMapping("/cart")
    public List<OrderItem> getCart() {
        return cart;
    }

    // ⭐ 新增：處理加減按鈕的 API
    @PutMapping("/cart/update/{index}")
    public String updateCartQty(@PathVariable int index, @RequestParam int change) {
        if (index >= 0 && index < cart.size()) {
            OrderItem item = cart.get(index);
            int newQty = item.getQty() + change;
            if (newQty > 0) {
                item.setQty(newQty);
            } else {
                cart.remove(index); // 減到 0 就移除
            }
            return "更新成功";
        }
        return "索引錯誤";
    }

    @DeleteMapping("/cart/{index}")
    public String deleteCart(@PathVariable int index) {
        if (index >= 0 && index < cart.size()) {
            cart.remove(index);
        }
        return "刪除成功";
    }
}
