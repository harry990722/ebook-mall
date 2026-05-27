// ⭐ 取得書籍圖片：優先用後端的 imageUrl，沒有才用書名猜
function getBookImage(titleOrProduct) {
    // 如果傳入的是物件（含 imageUrl）
    if (titleOrProduct && typeof titleOrProduct === "object") {
        if (titleOrProduct.imageUrl) return titleOrProduct.imageUrl;
        titleOrProduct = titleOrProduct.title || "";
    }
    const title = titleOrProduct || "";
    if (!title) return "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
    if (title.includes("Java"))     return "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80";
    if (title.includes("Spring"))   return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80";
    if (title.includes("前端"))      return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80";
    if (title.includes("微服務") || title.includes("架構")) return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80";
    if (title.includes("Docker") || title.includes("Kubernetes") || title.includes("雲端")) return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80";
    if (title.includes("Python") || title.includes("資料科學")) return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80";
    if (title.includes("致富") || title.includes("心態"))  return "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80";
    if (title.includes("習慣"))      return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80";
    if (title.includes("工作力"))    return "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80";
    if (title.includes("原則"))      return "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&q=80";
    if (title.includes("思考的藝術") || title.includes("邏輯")) return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80";
    if (title.includes("快思") || title.includes("慢想")) return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80";
    return "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
}

// ⭐ JWT Header（優先用 accessToken，舊版相容 token）
function authHeader() {
    let token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { "Authorization": "Bearer " + token } : {};
}

// ⭐ 清除所有登入資料
function clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
}

// ⭐ 用 Refresh Token 換新 Access Token（同步呼叫）
function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    let newToken = null;
    $.ajax({
        url: "/refresh",
        method: "POST",
        contentType: "application/json",
        async: false,  // ⭐ 同步呼叫，方便重試原請求
        data: JSON.stringify({ refreshToken: refreshToken }),
        success: function (res) {
            newToken = res.accessToken;
            localStorage.setItem("accessToken", res.accessToken);
            localStorage.setItem("token",       res.accessToken); // 相容舊版
        },
        error: function () {
            // Refresh Token 也失效，清除所有資料
            clearAuthData();
        }
    });
    return newToken;
}

// ⭐ 統一處理 401 — 嘗試換新 Token，失敗才跳登入頁
function handleApiError(xhr, defaultMsg) {
    if (xhr.status === 401 || xhr.status === 403) {
        // ⭐ 嘗試用 Refresh Token 換新
        const newToken = refreshAccessToken();
        if (newToken && xhr.status === 401) {
            // 換新成功 → 提示使用者重新操作（簡單做法）
            showToast("Token 已自動更新，請重試", "info");
            return;
        }
        // 換新失敗或本來就是 403 → 跳登入頁
        clearAuthData();
        window.location.href = "login.html";
    } else {
        showToast(defaultMsg || "❌ 發生錯誤，請稍後再試", "error");
    }
}

// ⭐ Toast 通知系統
function showToast(msg, type = "info") {
    // 建立容器（只建一次）
    if (!document.getElementById("toast-container")) {
        let el = document.createElement("div");
        el.id = "toast-container";
        el.style.cssText = `
            position: fixed; top: 80px; right: 24px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(el);
    }

    const colors = {
        success: { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "✅" },
        error:   { bg: "#fff5f5", border: "#fca5a5", text: "#991b1b", icon: "❌" },
        warn:    { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", icon: "⚠️" },
        info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "ℹ️" },
        cart:    { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "🛒" },
    };
    const c = colors[type] || colors.info;

    let toast = document.createElement("div");
    toast.style.cssText = `
        background: ${c.bg}; border: 1.5px solid ${c.border}; color: ${c.text};
        padding: 14px 20px; border-radius: 12px;
        font-size: 0.88rem; font-weight: 500; font-family: 'Noto Sans TC', sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        opacity: 0; transform: translateX(20px);
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        pointer-events: auto;
        min-width: 220px; max-width: 320px;
    `;
    toast.textContent = c.icon + " " + msg;
    document.getElementById("toast-container").appendChild(toast);

    // 動畫進場
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(0)";
        });
    });

    // 自動消失
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
