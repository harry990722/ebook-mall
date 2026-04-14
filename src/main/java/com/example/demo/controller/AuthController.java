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

    // 註冊功能
    @PostMapping("/register")
    public String register(@RequestBody User user) {
        // 使用 isPresent() 檢查 Optional 盒子裡是否有資料
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            return "帳號已存在";
        }
        repo.save(user);
        return "註冊成功";
    }

    // 登入功能
    @PostMapping("/login")
    public String login(@RequestBody User user) {
        // 使用 orElse(null) 將 User 從 Optional 盒子中取出
        User dbUser = repo.findByUsername(user.getUsername()).orElse(null);

        if (dbUser != null && dbUser.getPassword().equals(user.getPassword())) {
            return "success";
        }
        return "fail";
    }
}
