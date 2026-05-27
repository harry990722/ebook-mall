package com.example.demo.repository;

import com.example.demo.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // ⭐ 統計各商品銷售總量，依銷量排序
    @Query("SELECT oi.title, SUM(oi.qty) as totalQty, SUM(oi.price * oi.qty) as totalRevenue " +
           "FROM OrderItem oi " +
           "JOIN oi.order o WHERE o.status NOT IN ('cancelled', 'pending') " +
           "GROUP BY oi.title ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);
}
