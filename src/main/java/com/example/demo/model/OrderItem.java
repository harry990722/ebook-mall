package com.example.demo.model;

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

    // ⭐ 關聯 Order
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    public OrderItem() {}

    // Getter
    public String getTitle() { return title; }
    public int getPrice() { return price; }
    public int getQty() { return qty; }

    // Setter
    public void setTitle(String title) { this.title = title; }
    public void setPrice(int price) { this.price = price; }
    public void setQty(int qty) { this.qty = qty; }
    public void setOrder(Order order) { this.order = order; }
}