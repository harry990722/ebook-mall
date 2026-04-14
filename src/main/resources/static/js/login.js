$(document).ready(function () {

    $("#loginBtn").click(function () {

        let username = $("#username").val();
        let password = $("#password").val();

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

                    alert("登入成功！");

                    // ⭐ 存登入狀態
                    localStorage.setItem("login", "true");
                    localStorage.setItem("username", username);

                    // ⭐ 跳轉首頁
                    window.location.href = "index.html";

                } else {
                    alert("帳號或密碼錯誤！");
                }
            },

            error: function () {
                alert("伺服器錯誤！");
            }
        });

    });

});