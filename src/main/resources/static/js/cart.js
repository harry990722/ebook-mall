$(document).ready(function () {
    loadCart();
});

// ⭐ 判斷是否已登入，決定用後端或 localStorage
function isLoggedIn() {
    return !!localStorage.getItem("token") && !!localStorage.getItem("username");
}

function loadCart() {
    if (isLoggedIn()) {
        // 登入狀態：從後端載入
        $.ajax({
            url: "/cart", method: "GET", headers: authHeader(),
            success: function (items) {
                // 同步回 localStorage（供結帳頁使用）
                let local = items.map(i => ({
                    title: i.title, price: i.price,
                    qty: i.qty, productId: i.productId
                }));
                localStorage.setItem("cart", JSON.stringify(local));
                renderCart(items);
            },
            error: function (xhr) { handleApiError(xhr, "購物車載入失敗"); }
        });
    } else {
        // 未登入：從 localStorage 載入
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        renderCart(cart);
    }
}

function renderCart(items) {
    $("#cart-list").empty();
    let total = 0;
    let fmt = n => n.toLocaleString();

    if (!items || items.length === 0) {
        $("#cart-list").append(`
            <tr><td colspan="5">
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <p>購物車是空的，快去挑選喜歡的書吧！</p>
                </div>
            </td></tr>
        `);
        $("#totalPrice").text("0");
        return;
    }

    items.forEach((item, index) => {
        let subtotal = item.price * item.qty;
        total += subtotal;
        let id = item.productId || index; // 後端用 productId，localStorage 用 index

        $("#cart-list").append(`
        <tr>
            <td>
                <div class="fw-bold">${item.title}</div>
                <small style="color:var(--text-muted)">電子書</small>
            </td>
            <td style="text-align:center">NT$ ${fmt(item.price)}</td>
            <td style="text-align:center">
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQty('${id}', ${item.qty - 1})">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${id}', ${item.qty + 1})">+</button>
                </div>
            </td>
            <td style="text-align:center;font-weight:700;color:var(--red)">NT$ ${fmt(subtotal)}</td>
            <td style="text-align:center">
                <button class="trash-btn" onclick="removeItem('${id}')" title="移除">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
            </td>
        </tr>`);
    });
    $("#totalPrice").text(fmt(total));
}

function updateQty(id, newQty) {
    newQty = Math.min(Math.max(parseInt(newQty), 0), 99);

    if (isLoggedIn()) {
        if (newQty === 0) { removeItem(id); return; }
        $.ajax({
            url: `/cart/${id}`, method: "PUT",
            contentType: "application/json", headers: authHeader(),
            data: JSON.stringify({ qty: newQty }),
            success: function (items) {
                let local = items.map(i => ({ title: i.title, price: i.price, qty: i.qty, productId: i.productId }));
                localStorage.setItem("cart", JSON.stringify(local));
                renderCart(items);
            },
            error: function (xhr) { handleApiError(xhr, "更新失敗"); }
        });
    } else {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (newQty <= 0) { cart.splice(parseInt(id), 1); }
        else { cart[parseInt(id)].qty = newQty; }
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart(cart);
    }
}

function removeItem(id) {
    if (!confirm("確定要移除這本書嗎？")) return;
    if (isLoggedIn()) {
        $.ajax({
            url: `/cart/${id}`, method: "DELETE", headers: authHeader(),
            success: function (items) {
                let local = items.map(i => ({ title: i.title, price: i.price, qty: i.qty, productId: i.productId }));
                localStorage.setItem("cart", JSON.stringify(local));
                renderCart(items);
                updateNavCartCount(items);
            },
            error: function (xhr) { handleApiError(xhr, "移除失敗"); }
        });
    } else {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.splice(parseInt(id), 1);
        localStorage.setItem("cart", JSON.stringify(local));
        renderCart(cart);
    }
}

function updateNavCartCount(items) {
    let count = items.reduce((s, i) => s + i.qty, 0);
    let badge = $(".cart-badge");
    if (count > 0) {
        if (badge.length) badge.text(count);
        else $(".nav-cart").append(`<span class="cart-badge">${count}</span>`);
    } else {
        badge.remove();
    }
}
