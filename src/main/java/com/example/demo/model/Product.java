package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private int price;
    private String type;

    // ⭐ 圖片 URL（null 時前端自動用 getBookImage 產生）
    private String imageUrl;

    // ⭐ 商品描述（每本書獨立）— 用 TEXT 型態，長度不受限
    @Column(columnDefinition = "TEXT")
    private String description;

    public Product() {}

    public Product(String title, String author, int price, String type) {
        this.title  = title;
        this.author = author;
        this.price  = price;
        this.type   = type;
    }

    // ⭐ 含描述的建構子
    public Product(String title, String author, int price, String type, String description) {
        this.title  = title;
        this.author = author;
        this.price  = price;
        this.type   = type;
        this.description = description;
    }

    public Long getId()      { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle()  { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public int getPrice()     { return price; }
    public void setPrice(int price) { this.price = price; }

    public String getType()   { return type; }
    public void setType(String type) { this.type = type; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    // ⭐ description getter / setter
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // ⭐ 上架狀態：true = 上架，false = 停售
    private boolean active = true;

    // ⭐ 庫存數量
    private Integer stock = 0;

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Integer getStock() { return stock == null ? 0 : stock; }
    public void setStock(Integer stock) { this.stock = stock == null ? 0 : stock; }
}
