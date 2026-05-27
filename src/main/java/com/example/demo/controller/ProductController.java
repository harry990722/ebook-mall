package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.demo.repository.OrderItemRepository;
import org.springframework.data.domain.PageRequest;
import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import com.example.demo.util.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

@Tag(name = "商品管理", description = "商品查詢與後台 CRUD")
@RestController
@CrossOrigin
public class ProductController {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Autowired
    private JwtUtil jwtUtil;

    // ⭐ 每本書都有獨立描述，避免商品詳情頁文案全部一樣
    private static final String[][] DEFAULTS = {
        // title, author, price, type, description
        {"Java 21 程式開發實戰", "張小明", "450", "tech",
         "從 Java 基礎語法出發，深入介紹 Java 21 的虛擬執行緒、Record Pattern、Sealed Classes 等新特性。每章節皆附有可立即執行的範例程式碼，並搭配真實業務場景說明。無論是準備轉職的工程師，或是想升級技能的資深開發者，本書都能成為你的最佳夥伴。"},

        {"Spring Boot 3 核心技術", "王大同", "520", "tech",
         "全方位剖析 Spring Boot 3 的核心架構與最佳實踐，從 Auto-Configuration 機制、Spring MVC、Spring Data JPA，到 Spring Security、Actuator 監控、原生映像（GraalVM Native Image）應用。本書以「邊做邊學」的方式，帶領讀者建構出可用於生產環境的 RESTful API 系統。"},

        {"現代前端框架開發指南", "李小華", "380", "tech",
         "比較 React、Vue、Svelte 三大主流框架的設計哲學與適用場景。從元件化思維、狀態管理、路由設計、效能優化，到 SSR / SSG 部署策略一應俱全。閱讀完本書，您將能依專案需求選擇最適合的前端框架，並寫出可維護的現代化網頁應用。"},

        {"微服務架構設計與實踐", "林志強", "600", "tech",
         "微服務不只是技術選型，更是組織與系統的重新設計。本書從單體應用拆分策略、服務間通訊（REST / gRPC / 訊息佇列）、服務治理（註冊發現、熔斷、限流），到分散式資料一致性問題（Saga 模式）等核心議題，全面解析微服務的落地實踐。"},

        {"Docker + Kubernetes 雲端部署", "黃大牛", "480", "tech",
         "雲原生時代的必備技能。從 Docker 容器化基礎、Dockerfile 最佳實踐、Compose 編排，深入到 Kubernetes 的 Pod、Deployment、Service、Ingress、Helm Chart 等核心概念。本書搭配大量 yaml 範例與實機演練，讓讀者真正掌握雲端部署的精髓。"},

        {"Python 資料科學入門", "趙小雲", "350", "tech",
         "用最直觀的方式進入資料科學的世界。從 NumPy、Pandas 資料處理、Matplotlib / Seaborn 視覺化，到 Scikit-learn 機器學習與 Jupyter Notebook 開發環境，每章都搭配真實資料集練習。零基礎也能輕鬆上手，是踏入 AI 領域的最佳起點。"},

        {"致富心態：掌握財富心理", "摩根·豪瑟", "320", "business",
         "理財不只是數學，更是心理學。本書透過 18 個發人深省的故事，揭示了人們對金錢的非理性決策、貪婪與恐懼的循環，以及長期複利的真正威力。改變你對「成功」與「財富」的定義，培養一輩子受用的金錢觀。"},

        {"原子習慣：細微改變帶來巨大成就", "詹姆斯·克利爾", "280", "mind",
         "每天進步 1%，一年後將強大 37 倍。本書系統性地介紹了「習慣迴路」的四大法則：提示、渴望、回應、獎賞，並提供超過 50 個可立即實踐的技巧。讓微小的改變累積成卓越的人生，是行為改變領域不可錯過的經典。"},

        {"深度工作力：在淺薄時代生存", "卡爾·紐波特", "300", "mind",
         "在訊息爆炸、注意力稀缺的時代，「深度工作」的能力將成為最稀有也最具價值的競爭力。本書提供四大守則，協助你戒除社群媒體成癮、規劃高品質專注時段，創造出比一般人 10 倍的產出，重新掌握自己的人生。"},

        {"原則：生活與工作", "雷·達里歐", "450", "business",
         "全球最大避險基金橋水創辦人達里歐畢生智慧的精華。書中分享他如何透過建立「原則系統」做出更好的決策，包含徹底的透明、極端的真誠、思想開放的演算法決策。是創業者、管理者必讀的人生與經營指南。"},

        {"思考的藝術：52個邏輯錯誤", "魯爾夫．多伯里", "250", "mind",
         "為什麼聰明人也會犯蠢？本書透過 52 個簡短篇章，深入剖析人類思考時常犯的認知偏誤：確認偏誤、倖存者偏誤、沉沒成本謬誤等。讀完本書，你會發現自己的判斷力與決策品質明顯提升，少踩生活與職場中的雷。"},

        {"快思慢想：思考的捷徑", "丹尼爾·康納曼", "400", "mind",
         "諾貝爾經濟學獎得主康納曼的傳世巨作。本書揭示人腦的「系統一（直覺）」與「系統二（理性）」如何在我們做決定時相互角力，並透過大量實驗說明捷思法（heuristics）如何讓我們在不知不覺中犯錯。改變你看待自己思考方式的根本之作。"},
    };

    @PostConstruct
    public void init() {
        if (productRepo.count() > 0) {
            // ⭐ 資料已存在但可能沒 description（舊資料），自動補上
            backfillDescriptions();
            return;
        }
        for (String[] d : DEFAULTS) {
            Product p = new Product(d[0], d[1], Integer.parseInt(d[2]), d[3], d[4]);
            p.setStock(50);
            productRepo.save(p);
        }
    }

    // ⭐ 為舊資料補上 description（依書名比對）
    private void backfillDescriptions() {
        for (Product p : productRepo.findAll()) {
            if (p.getDescription() != null && !p.getDescription().isBlank()) continue;
            for (String[] d : DEFAULTS) {
                if (d[0].equals(p.getTitle())) {
                    p.setDescription(d[4]);
                    productRepo.save(p);
                    break;
                }
            }
        }
    }

    // ⭐ 銷售排行
    @Operation(summary = "取得銷售排行")
    @GetMapping("/products/ranking")
    public ResponseEntity<?> getSalesRanking(@RequestParam(defaultValue = "5") int top) {
        List<Object[]> rows = orderItemRepo.findTopSellingProducts(PageRequest.of(0, top));
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            Object[] row = rows.get(i);
            String title = (String) row[0];
            long totalQty = ((Number) row[1]).longValue();
            long totalRevenue = ((Number) row[2]).longValue();

            Product product = productRepo.findByActiveTrue().stream()
                .filter(p -> p.getTitle().equals(title))
                .findFirst().orElse(null);

            Map<String, Object> item = new java.util.HashMap<>();
            item.put("rank",         i + 1);
            item.put("title",        title);
            item.put("totalQty",     totalQty);
            item.put("totalRevenue", totalRevenue);
            item.put("productId",    product != null ? product.getId() : null);
            item.put("imageUrl",     product != null ? product.getImageUrl() : null);
            item.put("price",        product != null ? product.getPrice() : 0);
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "取得商品列表")
    @GetMapping("/products")
    public ResponseEntity<?> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(defaultValue = "")  String type,
            @RequestParam(defaultValue = "")  String keyword) {

        List<Product> all = productRepo.findByActiveTrue();
        if (!type.isEmpty())
            all = all.stream().filter(p -> type.equals(p.getType())).toList();

        if (!keyword.isEmpty()) {
            String kw = keyword.toLowerCase();
            all = all.stream().filter(p ->
                p.getTitle().toLowerCase().contains(kw) ||
                (p.getAuthor() != null && p.getAuthor().toLowerCase().contains(kw))
            ).toList();
        }

        int total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIdx = Math.min(page * size, total);
        int toIdx = Math.min(fromIdx + size, total);
        List<Product> pageData = all.subList(fromIdx, toIdx);

        return ResponseEntity.ok(Map.of(
            "content", pageData,
            "totalPages", totalPages,
            "totalItems", total,
            "currentPage", page
        ));
    }

    @Operation(summary = "【後台】取得所有商品（含停售）")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/admin/products/all")
    public ResponseEntity<?> getAllProducts(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");
        return ResponseEntity.ok(productRepo.findAll());
    }

    @Operation(summary = "取得單一商品")
    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        return productRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "【後台】新增商品")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/admin/products")
    public ResponseEntity<?> createProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Product product) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        return ResponseEntity.ok(productRepo.save(product));
    }

    @Operation(summary = "【後台】編輯商品")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/products/{id}")
    public ResponseEntity<?> updateProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Product updated) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        return productRepo.findById(id).map(p -> {
            p.setTitle(updated.getTitle());
            p.setAuthor(updated.getAuthor());
            p.setPrice(updated.getPrice());
            p.setType(updated.getType());
            p.setImageUrl(updated.getImageUrl());
            p.setStock(updated.getStock());
            p.setDescription(updated.getDescription());  // ⭐ 同步更新描述
            return ResponseEntity.ok(productRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "【後台】切換上架/停售")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/admin/products/{id}/toggle")
    public ResponseEntity<?> toggleProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("權限不足");
        return productRepo.findById(id).map(p -> {
            p.setActive(!p.isActive());
            return ResponseEntity.ok(productRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "【後台】刪除商品")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<?> deleteProduct(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!isAdmin(authHeader))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("請先登入或權限不足");
        if (!productRepo.existsById(id))
            return ResponseEntity.notFound().build();
        productRepo.deleteById(id);
        return ResponseEntity.ok("刪除成功");
    }

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        String token = authHeader.substring(7);
        return "admin".equals(jwtUtil.getRoleFromToken(token));
    }
}
