$(document).ready(function () {
    let username = localStorage.getItem("username");
    let html = "";

    // 判斷登入狀態來決定顯示內容
    let userSection = "";
    if (!username) {
        userSection = `
            <a class="nav-link px-3" href="login.html">會員登入</a>
            <a class="nav-link px-3" href="register.html">註冊</a>
        `;
    } else {
        userSection = `
            <span class="navbar-text text-white px-3">👋 歡迎，${username}</span>
            <a class="nav-link px-3" href="orders.html">我的訂單</a>
            <a class="nav-link px-3" href="#" id="logoutBtn">登出</a>
        `;
    }

    // 組合完整的 Bootstrap 導覽列
    html = `
    <nav class="navbar navbar-expand-lg navbar-dark shadow-sm">
        <div class="container d-flex justify-content-between">
            <a class="navbar-brand fw-bold" href="index.html">📚 電子書商城</a>
            <div class="d-flex align-items-center">
                <a class="nav-link px-3" href="index.html">首頁</a>
                ${userSection}
                <a class="btn btn-primary btn-sm ms-2 rounded-pill px-3" href="cart.html">
                    🛒 購物車
                </a>
            </div>
        </div>
    </nav>
    `;

    // 塞入 HTML
    $("#navbar").html(html);

    // 登出邏輯 (不變)
    $(document).on("click", "#logoutBtn", function () {
        localStorage.removeItem("username");
        localStorage.removeItem("login");
        alert("已登出");
        location.reload(); // 重新整理頁面
    });
});
