$(document).ready(function () {

function getCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

let username = localStorage.getItem("username");
let role     = localStorage.getItem("role");
let count    = getCartCount();

let adminLink = (role === "admin")
    ? `<a class="nav-link" href="admin.html">後台</a>`
    : "";

let userSection = !username ? `
    <a class="nav-link" href="login.html">登入</a>
    <a class="nav-link" href="register.html">註冊</a>
` : `
    <span class="nav-welcome">歡迎，${username}</span>
    <a class="nav-link" href="orders.html">我的訂單</a>
    ${adminLink}
    <a class="nav-link" href="#" id="logoutBtn">登出</a>
`;

let html = `
<nav class="site-nav">
    <div class="nav-inner">
        <a class="nav-brand" href="index.html">
            <span class="brand-icon">📚</span>
            <span class="brand-text">電子書商城</span>
        </a>
        <div class="nav-links">
            <a class="nav-link" href="index.html">首頁</a>
            ${userSection}
            <a class="nav-cart" href="cart.html">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span>購物車</span>
                ${count > 0 ? `<span class="cart-badge">${count}</span>` : ""}
            </a>
        </div>
    </div>
</nav>`;

$("#navbar").html(html);

$(document).on("click", "#logoutBtn", function () {
    if (confirm("確定要登出嗎？")) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("login");
        localStorage.removeItem("orderId");
        localStorage.removeItem("total");
        localStorage.removeItem("cartHash");
        window.location.href = "index.html";
    }
});

});
