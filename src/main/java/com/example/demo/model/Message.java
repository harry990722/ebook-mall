package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;        // 留言者姓名

    @Column(nullable = false, length = 100)
    private String email;       // 聯絡信箱

    @Column(length = 20)
    private String phone;       // 電話（選填）

    @Column(length = 30)
    private String subject;     // 留言主題：order(訂單) / product(商品) / refund(退款) / other(其他)

    @Column(nullable = false, length = 1000)
    private String content;     // 留言內容

    @Column(length = 50)
    private String username;    // 已登入會員的帳號（選填）

    @Column(nullable = false, length = 20)
    private String status = "pending";  // pending=待處理 / replied=已回覆 / closed=已結案

    @Column(length = 1000)
    private String reply;       // 管理員回覆內容

    private LocalDateTime createdAt;
    private LocalDateTime repliedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null)    status    = "pending";
    }

    // Getters & Setters
    public Long getId()                       { return id; }
    public void setId(Long id)                { this.id = id; }
    public String getName()                   { return name; }
    public void setName(String name)          { this.name = name; }
    public String getEmail()                  { return email; }
    public void setEmail(String email)        { this.email = email; }
    public String getPhone()                  { return phone; }
    public void setPhone(String phone)        { this.phone = phone; }
    public String getSubject()                { return subject; }
    public void setSubject(String subject)    { this.subject = subject; }
    public String getContent()                { return content; }
    public void setContent(String content)    { this.content = content; }
    public String getUsername()               { return username; }
    public void setUsername(String username)  { this.username = username; }
    public String getStatus()                 { return status; }
    public void setStatus(String status)      { this.status = status; }
    public String getReply()                  { return reply; }
    public void setReply(String reply)        { this.reply = reply; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public LocalDateTime getRepliedAt()       { return repliedAt; }
    public void setRepliedAt(LocalDateTime t) { this.repliedAt = t; }
}
