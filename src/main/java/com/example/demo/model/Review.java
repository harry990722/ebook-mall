package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;      // 1~5
    private String content;
    private Long productId;
    private String username;
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @PrePersist
    public void prePersist() { this.createdAt = LocalDateTime.now(); }

    public Review() {}

    public Long getId()           { return id; }
    public int getRating()        { return rating; }
    public void setRating(int r)  { this.rating = r; }
    public String getContent()    { return content; }
    public void setContent(String c) { this.content = c; }
    public Long getProductId()    { return productId; }
    public void setProductId(Long p) { this.productId = p; }
    public String getUsername()   { return username; }
    public void setUsername(String u) { this.username = u; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public User getUser()         { return user; }
    public void setUser(User u)   { this.user = u; }
}
