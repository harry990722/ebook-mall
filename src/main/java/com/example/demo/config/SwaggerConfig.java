package com.example.demo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {

        // ⭐ JWT Bearer Token 驗證設定
        SecurityScheme bearerScheme = new SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .description("請輸入登入後取得的 JWT Token（不需要加 Bearer 前綴）");

        SecurityRequirement securityRequirement = new SecurityRequirement()
            .addList("bearerAuth");

        return new OpenAPI()
            .info(new Info()
                .title("電子書商城 API")
                .version("1.0.0")
                .description("""
                    ## 電子書商城後端 API 文件
                    
                    ### 使用說明
                    1. 呼叫 `POST /login` 取得 JWT Token
                    2. 點擊右上角 **Authorize** 按鈕
                    3. 輸入 Token 後即可測試需要驗證的 API
                    
                    ### 角色權限
                    - **user**：一般會員，可瀏覽商品、管理購物車、查看自己的訂單
                    - **admin**：管理員，可管理商品、查看所有訂單、刪除任何評論
                    """)
                .contact(new Contact()
                    .name("電子書商城開發團隊")))
            .addSecurityItem(securityRequirement)
            .components(new Components()
                .addSecuritySchemes("bearerAuth", bearerScheme));
    }
}
