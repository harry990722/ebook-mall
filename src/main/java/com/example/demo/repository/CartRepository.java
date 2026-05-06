package com.example.demo.repository;

import com.example.demo.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserUsername(String username);
    Optional<CartItem> findByUserUsernameAndProductId(String username, Long productId);
    void deleteByUserUsername(String username);
    void deleteByUserUsernameAndProductId(String username, Long productId);
}
