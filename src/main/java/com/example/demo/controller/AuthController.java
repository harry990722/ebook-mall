package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@CrossOrigin
public class AuthController {

    @Autowired
    private UserRepository repo;

    // ⭐ 註冊
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty() ||
            user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("帳號或密碼不能為空");
        }
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("帳號已存在");
        }
        repo.save(user);
        return ResponseEntity.ok("註冊成功");
    }

    // ⭐ 登入：成功後回傳 JWT Token + username
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        User dbUser = repo.findByUsername(user.getUsername()).orElse(null);

        if (dbUser != null && dbUser.getPassword().equals(user.getPassword())) {
            String token = JwtUtil.generateToken(dbUser.getUsername());
            // 回傳 token 和 username，前端存入 localStorage
            return ResponseEntity.ok(Map.of(
                "token", token,
                "username", dbUser.getUsername()
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("帳號或密碼錯誤");
    }
}
