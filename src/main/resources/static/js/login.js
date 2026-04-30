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
                // ⭐ 後端現在回傳 { token, username }
                alert("🎉 登入成功！");
                localStorage.setItem("token", res.token);
                localStorage.setItem("username", res.username);

                let referrer = document.referrer;
                if (referrer && (referrer.includes("product.html") || referrer.includes("checkout.html"))) {
                    window.location.href = referrer;
                } else {
                    window.location.href = "index.html";
                }
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
