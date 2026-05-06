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

    public Product() {}

    public Product(String title, String author, int price, String type) {
        this.title  = title;
        this.author = author;
        this.price  = price;
        this.type   = type;
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
}
