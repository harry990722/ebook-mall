package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference; // 必須加這行
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

    @Transient
    private String username;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    // 設定為 EAGER 解決 LazyInitializationException
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference // 解決 JSON 無限遞迴
    private List<OrderItem> items;

    public Order() {}

    // ===== Getter & Setter =====
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
