package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    private String token;             // Refresh Token 字串

    @Column(nullable = false, length = 50)
    private String username;          // 對應的使用者帳號

    @Column(nullable = false)
    private LocalDateTime expiresAt;  // 過期時間

    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean revoked = false;  // 是否已撤銷（登出時設 true）

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId()                       { return id; }
    public void setId(Long id)                { this.id = id; }
    public String getToken()                  { return token; }
    public void setToken(String token)        { this.token = token; }
    public String getUsername()               { return username; }
    public void setUsername(String username)  { this.username = username; }
    public LocalDateTime getExpiresAt()       { return expiresAt; }
    public void setExpiresAt(LocalDateTime t) { this.expiresAt = t; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public boolean isRevoked()                { return revoked; }
    public void setRevoked(boolean revoked)   { this.revoked = revoked; }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
