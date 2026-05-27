package com.example.demo.controller;

import com.example.demo.model.Message;
import com.example.demo.repository.MessageRepository;
import com.example.demo.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Tag(name = "客服留言", description = "客戶留言系統，含前台留言、後台管理")
@RestController
@CrossOrigin
public class MessageController {

    @Autowired private MessageRepository messageRepo;
    @Autowired private JwtUtil           jwtUtil;

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        return "admin".equals(jwtUtil.getRoleFromToken(authHeader.substring(7)));
    }

    private String getUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try { return jwtUtil.getUsernameFromToken(authHeader.substring(7)); }
        catch (Exception e) { return null; }
    }

    // ⭐ 前台：新增留言（不需登入也可送出）
    @Operation(summary = "送出留言", description = "客戶送出客服留言，免登入")
    @PostMapping("/messages")
    public ResponseEntity<?> createMessage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Message message) {

        // 基本驗證
        if (message.getName() == null    || message.getName().isBlank() ||
            message.getEmail() == null   || message.getEmail().isBlank() ||
            message.getContent() == null || message.getContent().isBlank()) {
            return ResponseEntity.badRequest().body("請填寫姓名、信箱與留言內容");
        }
        if (message.getContent().length() > 1000)
            return ResponseEntity.badRequest().body("留言內容請勿超過 1000 字");

        // 若已登入，記錄 username
        String username = getUsername(authHeader);
        if (username != null) message.setUsername(username);

        message.setId(null);
        message.setStatus("pending");
        message.setReply(null);
        message.setRepliedAt(null);

        Message saved = messageRepo.save(message);
        return ResponseEntity.ok(Map.of(
            "id",      saved.getId(),
            "message", "✅ 留言已送出，客服將盡快回覆"
        ));
    }

    // ⭐ 會員：查看自己的留言
    @Operation(summary = "查看我的留言", description = "需登入，回傳當前使用者的留言記錄")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/messages/mine")
    public ResponseEntity<?> getMyMessages(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = getUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        return ResponseEntity.ok(messageRepo.findByUsernameOrderByCreatedAtDesc(username));
    }

    // ⭐ 後台：查看所有留言
    @Operation(summary = "【後台】所有留言", description = "管理員專用")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/admin/messages")
    public ResponseEntity<?> getAllMessages(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");
        return ResponseEntity.ok(messageRepo.findAllByOrderByCreatedAtDesc());
    }

    // ⭐ 後台：回覆留言
    @Operation(summary = "【後台】回覆留言", description = "管理員回覆並更新狀態")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/messages/{id}/reply")
    public ResponseEntity<?> replyMessage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        String replyText = body.get("reply");
        if (replyText == null || replyText.isBlank())
            return ResponseEntity.badRequest().body("回覆內容不可為空");

        Message msg = messageRepo.findById(id).orElse(null);
        if (msg == null)
            return ResponseEntity.notFound().build();

        msg.setReply(replyText);
        msg.setStatus("replied");
        msg.setRepliedAt(LocalDateTime.now());
        return ResponseEntity.ok(messageRepo.save(msg));
    }

    // ⭐ 後台：更新留言狀態
    @Operation(summary = "【後台】更新留言狀態")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/messages/{id}/status")
    public ResponseEntity<?> updateStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        String status = body.get("status");
        if (!List.of("pending", "replied", "closed").contains(status))
            return ResponseEntity.badRequest().body("狀態無效");

        Message msg = messageRepo.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.notFound().build();

        msg.setStatus(status);
        return ResponseEntity.ok(messageRepo.save(msg));
    }

    // ⭐ 後台：刪除留言
    @Operation(summary = "【後台】刪除留言")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/admin/messages/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");

        if (!messageRepo.existsById(id))
            return ResponseEntity.notFound().build();
        messageRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "已刪除"));
    }
}
