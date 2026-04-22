$(document).ready(function () {

    $("#registerBtn").click(function () {
        let username = $("#username").val().trim();
        let password = $("#password").val().trim();

        if (username === "" || password === "") {
            alert("請輸入帳號與密碼！");
            return;
        }

        let user = { username: username, password: password };

        $.ajax({
            url: "/register",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(user),
            success: function (res) {
                // 這裡要跟後端回傳的字串完全一致
                if (res.trim() === "註冊成功") {
                    
                    // ⭐ 這裡就是自動登入的關鍵：存入狀態
                    localStorage.setItem("login", "true");
                    localStorage.setItem("username", username);

                    alert("🎉 註冊成功！系統已為您自動登入。");

                    // 智慧跳轉邏輯
                    let referrer = document.referrer;
                    if (referrer && referrer.includes("product.html")) {
                        window.location.href = referrer;
                    } else {
                        window.location.href = "index.html";
                    }
                } else {
                    alert(res); // 顯示「帳號已存在」等訊息
                }
            },
            error: function () {
                alert("伺服器錯誤");
            }
        });
    });
});
