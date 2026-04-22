package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
public class AuthController {

    @Autowired
    private UserRepository repo;

    // ⭐ 註冊功能 (對應前端的「註冊成功」判斷)
    @PostMapping("/register")
    public String register(@RequestBody User user) {
        // 1. 檢查帳號密碼是否為空
        if (user.getUsername() == null || user.getUsername().trim().isEmpty() ||
            user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            return "帳號或密碼不能為空";
        }

        // 2. 檢查帳號是否已存在
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            return "帳號已存在";
        }

        // 3. 儲存新用戶
        repo.save(user);
        return "註冊成功";
    }

    // ⭐ 登入功能 (回傳 "success" 供 login.js 判斷)
    @PostMapping("/login")
    public String login(@RequestBody User user) {
        User dbUser = repo.findByUsername(user.getUsername()).orElse(null);

        if (dbUser != null && dbUser.getPassword().equals(user.getPassword())) {
            return "success";
        }
        return "fail";
    }
}
