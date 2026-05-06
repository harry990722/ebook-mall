package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "會員認證", description = "註冊、登入、修改密碼")
@RestController
@CrossOrigin
public class AuthController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private JwtUtil jwtUtil;

    // ⭐ BCrypt 加密器
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostConstruct
    public void initAdmin() {
        if (repo.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("1234")); // ⭐ 密碼加密
            admin.setRole("admin");
            repo.save(admin);
            System.out.println("✅ admin 帳號已建立（密碼已加密）");
        }
    }

    @Operation(summary = "會員註冊", description = "建立新帳號，role 自動設為 user")
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty() ||
            user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("帳號或密碼不能為空");
        }
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("帳號已存在");
        }
        user.setRole("user");
        user.setPassword(encoder.encode(user.getPassword())); // ⭐ 密碼加密後再存
        repo.save(user);
        return ResponseEntity.ok("註冊成功");
    }

    @Operation(summary = "會員登入", description = "成功後回傳 JWT Token、username、role")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        User dbUser = repo.findByUsername(user.getUsername()).orElse(null);

        // ⭐ 用 BCrypt 比對密碼
        if (dbUser != null && encoder.matches(user.getPassword(), dbUser.getPassword())) {
            String token = jwtUtil.generateToken(dbUser.getUsername(), dbUser.getRole());
            return ResponseEntity.ok(Map.of(
                "token",    token,
                "username", dbUser.getUsername(),
                "role",     dbUser.getRole()
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("帳號或密碼錯誤");
    }

    // ⭐ 修改密碼
    @Operation(summary = "修改密碼", description = "需登入，提供舊密碼與新密碼")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/user/password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {

        String username = extractUsername(authHeader);
        if (username == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入");

        String oldPwd = body.get("oldPassword");
        String newPwd = body.get("newPassword");

        if (newPwd == null || newPwd.length() < 4)
            return ResponseEntity.badRequest().body("新密碼至少需要 4 個字元");

        User user = repo.findByUsername(username).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("使用者不存在");

        if (!encoder.matches(oldPwd, user.getPassword()))
            return ResponseEntity.badRequest().body("舊密碼不正確");

        user.setPassword(encoder.encode(newPwd));
        repo.save(user);
        return ResponseEntity.ok("密碼修改成功");
    }

    private String extractUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return jwtUtil.getUsernameFromToken(authHeader.substring(7));
    }
}
