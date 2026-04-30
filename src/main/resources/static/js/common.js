function getBookImage(title) {

    if (!title) return "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";

    // ===== 逐本對應，確保每本書圖片不同 =====

    // ID 1: Java 21 程式開發實戰
    if (title.includes("Java")) {
        return "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80";
    }
    // ID 2: Spring Boot 3 核心技術
    if (title.includes("Spring")) {
        return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80";
    }
    // ID 3: 現代前端框架開發指南
    if (title.includes("前端")) {
        return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80";
    }
    // ID 4: 微服務架構設計與實踐
    if (title.includes("微服務") || title.includes("架構")) {
        return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80";
    }
    // ID 5: Docker + Kubernetes 雲端部署
    if (title.includes("Docker") || title.includes("Kubernetes") || title.includes("雲端")) {
        return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80";
    }
    // ID 6: Python 資料科學入門
    if (title.includes("Python") || title.includes("資料科學")) {
        return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80";
    }
    // ID 7: 致富心態
    if (title.includes("致富") || title.includes("心態")) {
        return "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80";
    }
    // ID 8: 原子習慣
    if (title.includes("習慣")) {
        return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80";
    }
    // ID 9: 深度工作力
    if (title.includes("工作力")) {
        return "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80";
    }
    // ID 10: 原則：生活與工作
    if (title.includes("原則")) {
        return "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&q=80";
    }
    // ID 11: 思考的藝術
    if (title.includes("思考的藝術") || title.includes("邏輯")) {
        return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80";
    }
    // ID 12: 快思慢想
    if (title.includes("快思") || title.includes("慢想")) {
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80";
    }

    // 預設
    return "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
}




// ⭐ 產生帶有 JWT Token 的 AJAX Header，所有需要驗證的請求都用這個
function authHeader() {
    let token = localStorage.getItem("token");
    return token ? { "Authorization": "Bearer " + token } : {};
}

function updateNavbar() {
    const username = localStorage.getItem("username");
    const $navUser = $("#nav-user");
    if (!$navUser.length) return;

    if (username) {
        $navUser.html(`
            👤 <span class="fw-bold text-primary">${username}</span>
            <button id="logoutBtn" class="btn btn-sm btn-outline-danger ms-2">登出</button>
        `);
        $("#logoutBtn").click(function () {
            if (confirm("確定要登出嗎？")) {
                // ⭐ 只清登入資料，保留購物車
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("login");
                localStorage.removeItem("orderId");
                localStorage.removeItem("total");
                location.reload();
            }
        });
    } else {
        $navUser.html(`
            <a class="nav-link px-3" href="login.html">登入</a>
            <a class="nav-link px-3" href="register.html">註冊</a>
        `);
    }
}

$(document).ready(function () {
    updateNavbar();
});
