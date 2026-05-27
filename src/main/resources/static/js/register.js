$(document).ready(function () {

    $("#registerBtn").click(function () {
        let username = $("#username").val().trim();
        let password = $("#password").val().trim();

        if (username === "" || password === "") {
            alert("請輸入帳號與密碼！");
            return;
        }

        $.ajax({
            url: "/register",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username, password }),

            success: function (res) {
                // ⭐ 後端回傳 JSON: { message: "註冊成功" }
                // 註冊成功後自動呼叫登入取得雙 Token
                $.ajax({
                    url: "/login",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ username, password }),
                    success: function (loginRes) {
                        // ⭐ 雙 Token：分別存 access 與 refresh
                        localStorage.setItem("accessToken",  loginRes.accessToken);
                        localStorage.setItem("refreshToken", loginRes.refreshToken);
                        localStorage.setItem("username",     loginRes.username);
                        localStorage.setItem("role",         loginRes.role);
                        // 相容舊版（之前用 token 的程式碼還能 work）
                        localStorage.setItem("token", loginRes.accessToken);

                        alert("🎉 註冊成功！系統已為您自動登入。");

                        let referrer = document.referrer;
                        if (referrer && referrer.includes("product.html")) {
                            window.location.href = referrer;
                        } else {
                            window.location.href = "index.html";
                        }
                    },
                    error: function () {
                        alert("註冊成功，但自動登入失敗，請手動登入。");
                        window.location.href = "login.html";
                    }
                });
            },
            error: function (xhr) {
                // ⭐ 400 代表後端有回傳具體原因（帳號已存在、欄位為空等）
                if (xhr.status === 400) {
                    // 後端可能回字串或 JSON
                    let msg = xhr.responseText;
                    try {
                        const obj = JSON.parse(msg);
                        msg = obj.message || obj.error || msg;
                    } catch (e) { /* 不是 JSON 就直接顯示 */ }
                    alert("❌ " + msg);
                } else {
                    alert("❗ 伺服器錯誤，請確認後端服務是否已啟動。");
                }
            }
        });
    });

    // 按 Enter 鍵送出
    $("#password, #username").keypress(function (e) {
        if (e.which == 13) $("#registerBtn").click();
    });
});
