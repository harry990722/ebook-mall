package com.example.demo.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * JWT 工具類 - 雙 Token 機制
 * - Access Token: 短效（預設 15 分鐘），用於 API 驗證
 * - Refresh Token: 長效（預設 7 天），用於換新 Access Token
 *
 * ⭐ 設計原則：
 *   解析方法（getUsernameFromToken / getRoleFromToken / getTokenType）
 *   遇到任何例外（過期、簽章錯誤、格式錯誤）一律回傳 null，
 *   讓呼叫端用「null → 視為未登入」的方式處理，
 *   而不是讓例外冒到 Controller 層導致 HTTP 500。
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-expiration:900000}")     // Access Token 預設 15 分鐘
    private long accessExpiration;

    @Value("${jwt.refresh-expiration:604800000}") // Refresh Token 預設 7 天
    private long refreshExpiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ⭐ 產生 Access Token（含 username + role）
    public String generateAccessToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ⭐ 產生 Refresh Token（用 UUID 確保唯一性）
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .claim("type", "refresh")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 解析 Token 取得 username
     * ⭐ 若 token 過期或無效，回 null 而非丟例外
     */
    public String getUsernameFromToken(String token) {
        Claims claims = parseClaimsSafely(token);
        return claims == null ? null : claims.getSubject();
    }

    /**
     * 解析 Token 取得 role
     * ⭐ 若 token 過期或無效，回 null
     */
    public String getRoleFromToken(String token) {
        Claims claims = parseClaimsSafely(token);
        if (claims == null) return null;
        Object role = claims.get("role");
        return role == null ? null : role.toString();
    }

    /**
     * 取得 Token 類型（access / refresh）
     * ⭐ 若 token 過期或無效，回 null
     */
    public String getTokenType(String token) {
        Claims claims = parseClaimsSafely(token);
        if (claims == null) return null;
        Object type = claims.get("type");
        return type == null ? null : type.toString();
    }

    /**
     * 驗證 Token 是否有效（未過期、簽章正確、格式正確）
     */
    public boolean isTokenValid(String token) {
        return parseClaimsSafely(token) != null;
    }

    // 取得過期時間
    public Date getExpiration(String token) {
        Claims claims = parseClaimsSafely(token);
        return claims == null ? null : claims.getExpiration();
    }

    // Refresh Token 過期時間（給 RefreshToken Entity 用）
    public long getRefreshExpirationMillis() {
        return refreshExpiration;
    }

    /**
     * ⭐ 安全版的 parseClaims：任何例外都吃下並回 null
     *   - ExpiredJwtException     Token 過期
     *   - MalformedJwtException   格式錯誤
     *   - SignatureException      簽章錯誤
     *   - IllegalArgumentException token 為 null 或空字串
     */
    private Claims parseClaimsSafely(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            // Token 過期、簽章錯誤、格式錯誤都會走到這裡
            return null;
        }
    }
}
