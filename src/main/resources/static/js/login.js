$(document).ready(function () {

    $("#loginBtn").click(function () {

        let username = $("#username").val().trim();
        let password = $("#password").val().trim();

        if (username === "" || password === "") {
            alert("請輸入帳號密碼！");
            return;
        }

        $.ajax({
            url: "/login",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username, password }),

            success: function (res) {
                // ⭐ 雙 Token 機制：分別存 access 與 refresh
                localStorage.setItem("accessToken",  res.accessToken);
                localStorage.setItem("refreshToken", res.refreshToken);
                localStorage.setItem("username",     res.username);
                localStorage.setItem("role",         res.role);
                // 相容舊版（之前的 token 還能 work）
                localStorage.setItem("token", res.accessToken);

                // ⭐ 方案 B：登入後合併本地購物車到後端
                //    完成後再做後續導頁，避免合併還沒結束就跳走
                mergeLocalCartIntoServer(function () {
                    redirectAfterLogin(res.role);
                });
            },

            error: function (xhr) {
                if (xhr.status === 401) {
                    alert("❌ 帳號或密碼錯誤，請再試一次！");
                } else {
                    alert("❗ 伺服器錯誤，請確認後端服務是否已啟動。");
                }
            }
        });
    });

    $("#password, #username").keypress(function (e) {
        if (e.which == 13) $("#loginBtn").click();
    });

});

/**
 * ⭐ 把本地（訪客時加入的）購物車合併到後端
 *    合併規則：相同 productId 取較大數量（避免反覆登入造成數量爆增）
 */
function mergeLocalCartIntoServer(done) {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];

    // 過濾出有 productId 的項目（沒有 productId 的舊資料無法跟後端對應，直接丟棄）
    const validItems = localCart.filter(i => i.productId != null && i.qty > 0);

    if (validItems.length === 0) {
        // 本地沒東西要合併，直接結束
        if (done) done();
        return;
    }

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    $.ajax({
        url: "/cart/merge",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + token },
        data: JSON.stringify({ items: validItems.map(i => ({ productId: i.productId, qty: i.qty })) }),
        success: function (mergedItems) {
            // ⭐ 用後端合併後的結果覆蓋本地
            const merged = (mergedItems || []).map(i => ({
                title: i.title, price: i.price, qty: i.qty, productId: i.productId
            }));
            localStorage.setItem("cart", JSON.stringify(merged));
        },
        error: function () {
            console.warn("[login] 購物車合併失敗，保留本地資料");
        },
        complete: function () {
            if (done) done();
        }
    });
}

/** 登入後依角色 / referrer 導向適當頁面 */
function redirectAfterLogin(role) {
    alert("🎉 登入成功！");

    if (role === "admin") {
        window.location.href = "admin.html";
        return;
    }

    let referrer = document.referrer;
    if (referrer && (referrer.includes("product.html") || referrer.includes("checkout.html"))) {
        window.location.href = referrer;
    } else {
        window.location.href = "index.html";
    }
}
