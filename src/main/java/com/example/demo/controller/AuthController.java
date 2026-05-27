package com.example.demo.controller;

import com.example.demo.model.RefreshToken;
import com.example.demo.model.User;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Tag(name = "會員系統", description = "註冊、登入、Token 換新、登出、修改密碼")
@RestController
@CrossOrigin
public class AuthController {

    @Autowired private UserRepository         userRepo;
    @Autowired private RefreshTokenRepository refreshTokenRepo;
    @Autowired private JwtUtil                jwtUtil;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ⭐ 自動建立 admin 帳號
    @PostConstruct
    public void initAdmin() {
        if (userRepo.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("1234"));
            admin.setRole("admin");
            userRepo.save(admin);
        }
    }

    // ⭐ 註冊
    @Operation(summary = "註冊", description = "註冊新會員（預設 user 角色）")
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()
            || user.getPassword() == null || user.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("帳號與密碼不可為空");
        }
        if (userRepo.findByUsername(user.getUsername()).isPresent())
            return ResponseEntity.badRequest().body("帳號已存在");

        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole("user");
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "註冊成功"));
    }

    // ⭐ 登入：回傳 Access + Refresh 雙 Token
    @Operation(summary = "登入", description = "登入並取得 Access Token (15分) 與 Refresh Token (7天)")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User input) {
        Optional<User> opt = userRepo.findByUsername(input.getUsername());
        if (opt.isEmpty() || !encoder.matches(input.getPassword(), opt.get().getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("帳號或密碼錯誤");

        User user = opt.get();
        String accessToken  = jwtUtil.generateAccessToken(user.getUsername(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

        // ⭐ 將 Refresh Token 存入資料庫（可主動撤銷）
        RefreshToken rt = new RefreshToken();
        rt.setToken(refreshToken);
        rt.setUsername(user.getUsername());
        rt.setExpiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpirationMillis() / 1000));
        refreshTokenRepo.save(rt);

        return ResponseEntity.ok(Map.of(
            "accessToken",  accessToken,
            "refreshToken", refreshToken,
            "username",     user.getUsername(),
            "role",         user.getRole()
        ));
    }

    // ⭐ 換新 Access Token
    @Operation(summary = "換新 Access Token", description = "使用 Refresh Token 換取新的 Access Token")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank())
            return ResponseEntity.badRequest().body("Refresh Token 不可為空");

        // 驗證 JWT 簽章
        if (!jwtUtil.isTokenValid(refreshToken))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token 無效或已過期");

        // 確認 Token 類型是 refresh
        if (!"refresh".equals(jwtUtil.getTokenType(refreshToken)))
            return ResponseEntity.badRequest().body("Token 類型錯誤，需提供 Refresh Token");

        // 查資料庫，確認沒被撤銷
        RefreshToken storedToken = refreshTokenRepo.findByToken(refreshToken).orElse(null);
        if (storedToken == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token 不存在");
        if (storedToken.isRevoked())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token 已被撤銷，請重新登入");
        if (storedToken.isExpired())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token 已過期");

        // 產生新的 Access Token
        User user = userRepo.findByUsername(storedToken.getUsername()).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("使用者不存在");

        String newAccessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getRole());
        return ResponseEntity.ok(Map.of(
            "accessToken", newAccessToken,
            "username",    user.getUsername(),
            "role",        user.getRole()
        ));
    }

    // ⭐ 登出：撤銷 Refresh Token
    @Operation(summary = "登出", description = "撤銷使用者所有 Refresh Token")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenRepo.findByToken(refreshToken).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepo.save(rt);
            });
        }
        return ResponseEntity.ok(Map.of("message", "登出成功"));
    }

    // ⭐ 修改密碼
    @Operation(summary = "修改密碼", description = "需登入，需提供舊密碼與新密碼")
    @PutMapping("/users/password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {

        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("未登入");
        String token = authHeader.substring(7);
        if (!jwtUtil.isTokenValid(token))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token 無效");

        String username    = jwtUtil.getUsernameFromToken(token);
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 4)
            return ResponseEntity.badRequest().body("新密碼至少 4 個字元");

        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("使用者不存在");
        if (!encoder.matches(oldPassword, user.getPassword()))
            return ResponseEntity.badRequest().body("舊密碼不正確");

        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);

        // ⭐ 改密碼時撤銷所有 Refresh Token（安全考量）
        refreshTokenRepo.revokeAllByUsername(username);

        return ResponseEntity.ok(Map.of("message", "密碼已更新，請重新登入"));
    }
}
