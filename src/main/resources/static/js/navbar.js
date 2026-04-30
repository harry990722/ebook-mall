$(document).ready(function () {

// ⭐ 計算購物車數量
function getCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

let username = localStorage.getItem("username");

let userSection = !username ? `
    <a class="nav-link px-3" href="login.html">會員登入</a>
    <a class="nav-link px-3" href="register.html">註冊</a>
` : `
    <span class="navbar-text text-white px-3">👋 歡迎，${username}</span>
    <a class="nav-link px-3" href="orders.html">我的訂單</a>
    <a class="nav-link px-3" href="#" id="logoutBtn">登出</a>
`;

let html = `
<nav class="navbar navbar-expand-lg navbar-dark shadow-sm">
    <div class="container d-flex justify-content-between">
        
        <a class="navbar-brand fw-bold" href="index.html">📚 電子書商城</a>

        <div class="d-flex align-items-center">
            <a class="nav-link px-3" href="index.html">首頁</a>
            
            ${userSection}

            <!-- ⭐ 購物車（含數量） -->
            <a class="btn btn-primary btn-sm ms-2 rounded-pill px-3 position-relative" href="cart.html">
                🛒 購物車
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    ${getCartCount()}
                </span>
            </a>
        </div>

    </div>
</nav>`;

$("#navbar").html(html);

// 登出
$(document).on("click", "#logoutBtn", function () {
    if (confirm("確定要登出嗎？")) {
        // ⭐ 只清登入資料，保留購物車
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("login");
        localStorage.removeItem("orderId");
        localStorage.removeItem("total");
        alert("已登出");
        window.location.href = "index.html";
    }
});

});