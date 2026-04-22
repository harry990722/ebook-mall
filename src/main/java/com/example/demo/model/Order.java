package com.example.demo.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private int total;

    private String status; // pending / paid

    // ⭐ 不存DB，只接前端 username
    @Transient
    private String username;

    // ⭐ 關聯使用者
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER) // 1. 改成 EAGER 立即抓取
    @JsonManagedReference // 2. 防止與 OrderItem 產生無限遞迴迴圈
    private List<OrderItem> items;

    // ⭐ 必備無參數建構子
    public Order() {}

    // ===== Getter =====
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public int getTotal() { return total; }
    public String getStatus() { return status; }
    public String getUsername() { return username; }
    public User getUser() { return user; }

    // ===== Setter =====
    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
    public void setTotal(int total) { this.total = total; }
    public void setStatus(String status) { this.status = status; }
    public void setUsername(String username) { this.username = username; }
    public void setUser(User user) { this.user = user; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
