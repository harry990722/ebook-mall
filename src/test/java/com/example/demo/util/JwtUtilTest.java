package com.example.demo.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JwtUtil 單元測試
 * 測試 Access Token 與 Refresh Token 雙 Token 機制
 */
@DisplayName("JWT 工具類測試")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        // 用反射注入測試用的設定值
        ReflectionTestUtils.setField(jwtUtil, "secret", "TestSecretKey_MustBe32CharsLong!!!");
        ReflectionTestUtils.setField(jwtUtil, "accessExpiration", 900000L);     // 15 分鐘
        ReflectionTestUtils.setField(jwtUtil, "refreshExpiration", 604800000L); // 7 天
    }

    @Test
    @DisplayName("產生 Access Token：應包含 username 與 role")
    void generateAccessToken_shouldContainUsernameAndRole() {
        String token = jwtUtil.generateAccessToken("alice", "user");

        assertNotNull(token);
        assertEquals("alice", jwtUtil.getUsernameFromToken(token));
        assertEquals("user",  jwtUtil.getRoleFromToken(token));
        assertEquals("access", jwtUtil.getTokenType(token));
    }

    @Test
    @DisplayName("產生 Refresh Token：類型應為 refresh")
    void generateRefreshToken_shouldHaveRefreshType() {
        String token = jwtUtil.generateRefreshToken("bob");

        assertNotNull(token);
        assertEquals("bob", jwtUtil.getUsernameFromToken(token));
        assertEquals("refresh", jwtUtil.getTokenType(token));
    }

    @Test
    @DisplayName("有效的 Token 應通過驗證")
    void isTokenValid_validToken_shouldReturnTrue() {
        String token = jwtUtil.generateAccessToken("charlie", "admin");
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    @DisplayName("無效的 Token 應驗證失敗")
    void isTokenValid_invalidToken_shouldReturnFalse() {
        assertFalse(jwtUtil.isTokenValid("this-is-not-a-jwt"));
        assertFalse(jwtUtil.isTokenValid(""));
    }

    @Test
    @DisplayName("Admin 的 Token 應有 admin role")
    void adminToken_shouldHaveAdminRole() {
        String token = jwtUtil.generateAccessToken("admin", "admin");
        assertEquals("admin", jwtUtil.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Access Token 與 Refresh Token 不應相同")
    void accessAndRefreshToken_shouldBeDifferent() {
        String access  = jwtUtil.generateAccessToken("user1", "user");
        String refresh = jwtUtil.generateRefreshToken("user1");
        assertNotEquals(access, refresh);
    }
}
