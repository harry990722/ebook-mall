package com.example.demo.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

public class JwtUtil {

    // ⭐ 密鑰：至少 256 bits，正式上線請改從環境變數讀取
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(
        "MySecretKey_MustBe32CharsOrMore!!".getBytes()
    );

    // Token 有效期：7 天
    private static final long EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000L;

    // ===== 產生 Token =====
    public static String generateToken(String username) {
        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
            .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
            .compact();
    }

    // ===== 驗證並解析 username =====
    // 回傳 null 代表 Token 無效或已過期
    public static String getUsernameFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
