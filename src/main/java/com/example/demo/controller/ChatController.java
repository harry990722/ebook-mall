package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Tag(name = "AI 客服小幫手", description = "整合 Google Gemini API")
@RestController
@CrossOrigin
@RequestMapping("/chat")
public class ChatController {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    // ⭐ 系統提示詞：限制 AI 角色與回答範圍
    private static final String SYSTEM_PROMPT = """
        你是「電子書商城」的線上客服小幫手「小書」，使用繁體中文回答。
        
        【商城資訊】
        - 商城提供技術類、商業類、心理類電子書，全館 79 折優惠
        - 付款方式：信用卡、LINE Pay、貨到付款
        - 訂單狀態：待付款、待取貨、已付款、已出貨、已完成、已取消
        - 訂單可在「待付款」「待取貨」階段取消
        - 註冊登入後可使用購物車、評論、訂單功能
        - admin 帳號可進入後台管理商品、訂單、Banner
        - 評論系統：每人每本書可評 1~5 星一次
        
        【回答規則】
        1. 只回答與電子書商城相關的問題（購書、訂單、付款、會員、商品）
        2. 遇到無關問題（如天氣、政治、其他電商），禮貌引導回主題
        3. 回答簡潔明確，使用列點時最多 3 點
        4. 語氣親切，可適度使用 emoji
        5. 不知道答案時請回答「這部分建議聯絡真人客服」
        """;

    @Operation(summary = "向 AI 客服發送訊息", description = "使用 Google Gemini API 回應")
    @PostMapping("/message")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        // 檢查 API Key
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("your-key")) {
            return ResponseEntity.ok(Map.of(
                "reply", "⚠️ 客服系統尚未設定 API Key，請聯絡管理員。"
            ));
        }

        String userMessage = (String) body.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "請輸入訊息"));
        }

        // 對話歷史（前端可傳入）
        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) body.getOrDefault("history", new ArrayList<>());

        try {
            // ⭐ Gemini API 的 contents 格式
            //   role: "user" 或 "model"（Gemini 用 model 不用 assistant）
            //   parts: [{ text: "..." }]
            List<Map<String, Object>> contents = new ArrayList<>();

            // 歷史對話（最多 6 輪）
            int start = Math.max(0, history.size() - 6);
            for (int i = start; i < history.size(); i++) {
                Map<String, String> h = history.get(i);
                String role = h.get("role");
                // 把 OpenAI 風格的 assistant 改成 Gemini 的 model
                String geminiRole = "assistant".equals(role) ? "model" : "user";
                contents.add(Map.of(
                    "role",  geminiRole,
                    "parts", List.of(Map.of("text", h.get("content")))
                ));
            }

            // 新的使用者訊息
            contents.add(Map.of(
                "role",  "user",
                "parts", List.of(Map.of("text", userMessage))
            ));

            // 組合請求 body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);
            // ⭐ Gemini 把 system prompt 放在 systemInstruction
            requestBody.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
            ));
            // 產生設定
            requestBody.put("generationConfig", Map.of(
                "temperature",     0.7,
                "maxOutputTokens", 2048,
                "topP",            0.95,
                "topK",            40
            ));

            // 設定 Header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // ⭐ Gemini API URL（API Key 放在 query string）
            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
                          + model + ":generateContent?key=" + apiKey;

            // 發送請求（設定 timeout）
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(10000);
            factory.setReadTimeout(30000);
            RestTemplate restTemplate = new RestTemplate(factory);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl, HttpMethod.POST, request, Map.class);

            // ⭐ 解析 Gemini 回應
            @SuppressWarnings("unchecked")
            Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
            if (responseBody == null) {
                return ResponseEntity.ok(Map.of("reply", "❌ AI 沒有回應，請稍後再試"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return ResponseEntity.ok(Map.of("reply", "❌ AI 回應格式錯誤"));
            }

            Map<String, Object> firstCandidate = candidates.get(0);

            // ⭐ 檢查為什麼結束（debug 用）
            String finishReason = (String) firstCandidate.get("finishReason");
            System.out.println("[Gemini] finishReason = " + finishReason);

            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            if (content == null) {
                if ("SAFETY".equals(finishReason)) {
                    return ResponseEntity.ok(Map.of("reply", "⚠️ 此問題被 AI 安全機制過濾，請換個方式提問。"));
                }
                return ResponseEntity.ok(Map.of("reply", "❌ AI 回應為空（" + finishReason + "）"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return ResponseEntity.ok(Map.of("reply", "❌ AI 回應為空"));
            }

            String reply = (String) parts.get(0).get("text");

            // ⭐ 如果是 MAX_TOKENS 切斷，告知使用者
            if ("MAX_TOKENS".equals(finishReason) && reply != null) {
                reply += "\n\n（提示：回應較長已被截斷，請重新提問更具體的問題）";
            }

            return ResponseEntity.ok(Map.of("reply", reply != null ? reply : "❌ 沒有文字內容"));

        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            return ResponseEntity.ok(Map.of(
                "reply", "😅 抱歉，AI 客服目前忙線中（API 用量超過限制），請稍候 30 秒再試。"
            ));
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            return ResponseEntity.ok(Map.of(
                "reply", "⚠️ API Key 無效或未設定，請聯絡管理員。"
            ));
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            return ResponseEntity.ok(Map.of(
                "reply", "⚠️ AI 模型不存在或已下架，請聯絡管理員更新模型名稱。\n錯誤：404 model not found"
            ));
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return ResponseEntity.ok(Map.of(
                "reply", "😅 AI 客服 API 錯誤：" + e.getStatusCode() + "\n請聯絡管理員。"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of(
                "reply", "😅 抱歉，AI 客服暫時無法回應，請稍後再試。"
            ));
        }
    }
}
