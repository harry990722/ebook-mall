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
                if (res.trim() === "註冊成功") {
                    // ⭐ 註冊成功後自動呼叫登入取得 Token
                    $.ajax({
                        url: "/login",
                        method: "POST",
                        contentType: "application/json",
                        data: JSON.stringify({ username, password }),
                        success: function (loginRes) {
                            localStorage.setItem("token", loginRes.token);
                            localStorage.setItem("username", loginRes.username);
                            alert("🎉 註冊成功！系統已為您自動登入。");
                            let referrer = document.referrer;
                            if (referrer && referrer.includes("product.html")) {
                                window.location.href = referrer;
                            } else {
                                window.location.href = "index.html";
                            }
                        }
                    });
                } else {
                    alert(res);
                }
            },
            error: function (xhr) {
                // ⭐ 400 代表後端有回傳具體原因（帳號已存在、欄位為空等）
                if (xhr.status === 400 && xhr.responseText) {
                    alert("❌ " + xhr.responseText);
                } else {
                    alert("❗ 伺服器錯誤，請確認後端服務是否已啟動。");
                }
            }
        });
    });
});
