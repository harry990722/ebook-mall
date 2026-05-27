package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * AuthController 單元測試 - 使用 Mockito 模擬 Repository
 */
@DisplayName("會員認證控制器測試")
class AuthControllerTest {

    @Mock private UserRepository         userRepo;
    @Mock private RefreshTokenRepository refreshTokenRepo;
    @Mock private JwtUtil                jwtUtil;

    @InjectMocks
    private AuthController authController;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        authController = new AuthController();
        ReflectionTestUtils.setField(authController, "userRepo",         userRepo);
        ReflectionTestUtils.setField(authController, "refreshTokenRepo", refreshTokenRepo);
        ReflectionTestUtils.setField(authController, "jwtUtil",          jwtUtil);
    }

    @Test
    @DisplayName("註冊：帳號已存在應回傳 400")
    void register_duplicateUsername_shouldReturn400() {
        User existingUser = new User();
        existingUser.setUsername("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(existingUser));

        User newUser = new User();
        newUser.setUsername("alice");
        newUser.setPassword("1234");

        ResponseEntity<?> response = authController.register(newUser);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("帳號已存在", response.getBody());
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("註冊：空帳號或空密碼應回傳 400")
    void register_emptyInput_shouldReturn400() {
        User user = new User();
        user.setUsername("");
        user.setPassword("");

        ResponseEntity<?> response = authController.register(user);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("註冊：密碼必須經過 BCrypt 加密儲存")
    void register_password_shouldBeBCryptEncoded() {
        when(userRepo.findByUsername("newuser")).thenReturn(Optional.empty());

        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setPassword("plaintext123");

        authController.register(newUser);

        verify(userRepo).save(argThat(user -> {
            // 儲存的密碼不應該是原始密碼，應為 BCrypt hash（以 $2 開頭）
            return !user.getPassword().equals("plaintext123")
                && user.getPassword().startsWith("$2");
        }));
    }

    @Test
    @DisplayName("登入：密碼錯誤應回傳 401")
    void login_wrongPassword_shouldReturn401() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword(encoder.encode("correct"));
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));

        User input = new User();
        input.setUsername("alice");
        input.setPassword("wrong");

        ResponseEntity<?> response = authController.login(input);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("登入:不存在的帳號應回傳 401")
    void login_userNotFound_shouldReturn401() {
        when(userRepo.findByUsername("ghost")).thenReturn(Optional.empty());

        User input = new User();
        input.setUsername("ghost");
        input.setPassword("any");

        ResponseEntity<?> response = authController.login(input);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("登入：成功應回傳雙 Token")
    void login_success_shouldReturnDualTokens() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword(encoder.encode("1234"));
        user.setRole("user");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken("alice", "user")).thenReturn("ACCESS_TOKEN");
        when(jwtUtil.generateRefreshToken("alice")).thenReturn("REFRESH_TOKEN");
        when(jwtUtil.getRefreshExpirationMillis()).thenReturn(604800000L);

        User input = new User();
        input.setUsername("alice");
        input.setPassword("1234");

        ResponseEntity<?> response = authController.login(input);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> body = (java.util.Map<String, Object>) response.getBody();
        assertEquals("ACCESS_TOKEN",  body.get("accessToken"));
        assertEquals("REFRESH_TOKEN", body.get("refreshToken"));
        verify(refreshTokenRepo).save(any());  // Refresh Token 應存入 DB
    }
}
