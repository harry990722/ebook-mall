$(document).ready(function () {

    $("#loginBtn").click(function () {

        let username = $("#username").val().trim();
        let password = $("#password").val().trim();

        // 基本驗證
        if (username === "" || password === "") {
            alert("請輸入帳號密碼！");
            return;
        }

        let user = {
            username: username,
            password: password
        };

        $.ajax({
            url: "/login",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(user),

            success: function (res) {

                if (res === "success") {

                    alert("🎉 登入成功！");

                    // ⭐ 存入登入狀態與使用者名稱
                    localStorage.setItem("login", "true");
                    localStorage.setItem("username", username);

                    // ⭐ 判斷應該跳轉到哪裡
                    // 如果是從結帳頁被踢過來的，或是從商品頁來的，就回原位
                    let referrer = document.referrer;
                    
                    if (referrer && (referrer.includes("product.html") || referrer.includes("checkout.html"))) {
                        window.location.href = referrer;
                    } else {
                        // 否則預設跳轉回首頁
                        window.location.href = "index.html";
                    }

                } else {
                    alert("❌ 帳號或密碼錯誤，請再試一次！");
                }
            },

            error: function () {
                alert("❗ 伺服器錯誤，請確認後端服務是否已啟動。");
            }
        });

    });

    // 額外小功能：按 Enter 鍵也能觸發登入
    $("#password, #username").keypress(function (e) {
        if (e.which == 13) {
            $("#loginBtn").click();
        }
    });