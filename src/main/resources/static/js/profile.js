$(document).ready(function () {
    if (!localStorage.getItem("username")) {
        window.location.href = "login.html"; return;
    }

    let username = localStorage.getItem("username");
    let role     = localStorage.getItem("role");
    $("#profileUsername").text(username);
    $("#profileRole").text(role === "admin" ? "⚙️ 系統管理員" : "👤 一般會員");

    $("#changePasswordBtn").click(function () {
        let oldPwd     = $("#oldPassword").val().trim();
        let newPwd     = $("#newPassword").val().trim();
        let confirmPwd = $("#confirmPassword").val().trim();

        if (!oldPwd || !newPwd || !confirmPwd) {
            showToast("請填寫所有欄位", "warn"); return;
        }
        if (newPwd.length < 4) {
            showToast("新密碼至少需要 4 個字元", "warn"); return;
        }
        if (newPwd !== confirmPwd) {
            showToast("兩次輸入的新密碼不一致", "warn"); return;
        }

        let $btn = $(this);
        $btn.prop("disabled", true).html('<span class="btn-spinner"></span>更新中...');

        $.ajax({
            url: "/user/password",
            method: "PUT",
            contentType: "application/json",
            headers: authHeader(),
            data: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
            success: function () {
                showToast("密碼修改成功！", "success");
                $("#oldPassword, #newPassword, #confirmPassword").val("");
            },
            error: function (xhr) {
                if (xhr.status === 400) {
                    showToast("❌ " + xhr.responseText, "error");
                } else {
                    handleApiError(xhr, "修改失敗，請稍後再試");
                }
            },
            complete: function () {
                $btn.prop("disabled", false).html("確認修改密碼");
            }
        });
    });
});
