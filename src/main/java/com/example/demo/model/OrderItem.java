package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference; // 必須加這行
import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private int price;
    private int qty;

    @ManyToOne
    @JoinColumn(name = "order_id")
    @JsonBackReference // 解決 JSON 無限遞迴，避免與 Order 互相讀取導致崩潰
    private Order order;

    public OrderItem() {}

    // ===== Getter & Setter =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
}