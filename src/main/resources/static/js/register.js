$(document).ready(function () {

    $("#registerBtn").click(function () {

        let username = $("#username").val();
        let password = $("#password").val();

        if (username === "" || password === "") {
            alert("請填寫完整！");
            return;
        }

        let user = {
            username: username,
            password: password
        };

        $.ajax({
            url: "/register",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(user),

            success: function (res) {

                alert(res);

                if (res === "註冊成功") {
                    window.location.href = "login.html";
                }
            }
        });

    });

});