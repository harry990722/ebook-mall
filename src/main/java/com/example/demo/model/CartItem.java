package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cart_items",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"}))
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private int qty;

    public CartItem() {}

    public Long getId()            { return id; }
    public User getUser()          { return user; }
    public void setUser(User u)    { this.user = u; }
    public Product getProduct()    { return product; }
    public void setProduct(Product p) { this.product = p; }
    public int getQty()            { return qty; }
    public void setQty(int q)      { this.qty = Math.min(Math.max(q, 1), 99); }
}
