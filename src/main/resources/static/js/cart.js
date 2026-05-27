$(document).ready(function () {
    // ⭐ 不論 loadStockMap 成敗都要呼叫 loadCart
    //    否則商品 API 一出錯，購物車就完全顯示不出來
    loadStockMap(loadCart);
});

// ⭐ 判斷是否已登入
function isLoggedIn() {
    return !!localStorage.getItem("token") && !!localStorage.getItem("username");
}

// ⭐ 快取所有商品庫存（用 productId 為 key）
let productStockMap = {};

function loadStockMap(callback) {
    $.ajax({
        url: "/products?size=200",
        method: "GET",
        success: function (res) {
            const list = res.content || res;
            list.forEach(p => {
                productStockMap[p.id] = p.stock != null ? p.stock : 0;
            });
        },
        error: function () {
            console.warn("[cart] 載入商品庫存資料失敗，購物車仍可顯示但無法檢查庫存上限");
        },
        complete: function () {
            // ⭐ 不論成敗都呼叫，避免卡死
            if (callback) callback();
        }
    });
}

function loadCart() {
    if (isLoggedIn()) {
        // 登入狀態：從後端載入
        $.ajax({
            url: "/cart",
            method: "GET",
            headers: authHeader(),
            success: function (items) {
                // 同步回 localStorage（供結帳頁使用）
                let local = (items || []).map(i => ({
                    title: i.title, price: i.price,
                    qty: i.qty, productId: i.productId
                }));
                localStorage.setItem("cart", JSON.stringify(local));
                renderCart(items || []);
            },
            error: function (xhr) {
                // ⭐ 後端讀不到時，fallback 用 localStorage（讓使用者至少看得到自己的購物車）
                console.warn("[cart] 後端購物車載入失敗，改用本地資料", xhr.status);
                let local = JSON.parse(localStorage.getItem("cart")) || [];
                renderCart(local);
                if (xhr.status === 401) {
                    // 401 才走預設處理（清除 token 跳登入）
                    handleApiError(xhr, "請重新登入");
                }
            }
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
        let id = item.productId || index;
        // ⭐ 庫存上限（若 loadStockMap 失敗，就不顯示上限提示）
        const stockLimit = item.productId != null ? productStockMap[item.productId] : null;
        const reachedLimit = stockLimit != null && item.qty >= stockLimit;

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
                    <button class="qty-btn" onclick="updateQty('${id}', ${item.qty + 1})"
                        ${reachedLimit ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>+</button>
                </div>
                ${reachedLimit
                    ? '<div style="font-size:0.72rem;color:#c9a84c;margin-top:4px">已達庫存上限</div>' : ''}
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

    // 前端先做庫存檢查（productId 對應的庫存）
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let pid;
    if (isLoggedIn()) {
        pid = id;
    } else {
        pid = cart[parseInt(id)]?.productId;
    }
    if (pid && productStockMap[pid] != null && newQty > productStockMap[pid]) {
        showToast(`數量超過庫存（僅剩 ${productStockMap[pid]} 本）`, "warn");
        return;
    }

    if (isLoggedIn()) {
        if (newQty === 0) { removeItem(id); return; }
        $.ajax({
            url: `/cart/${id}`,
            method: "PUT",
            contentType: "application/json",
            headers: authHeader(),
            data: JSON.stringify({ qty: newQty }),
            success: function (items) {
                let local = items.map(i => ({ title: i.title, price: i.price, qty: i.qty, productId: i.productId }));
                localStorage.setItem("cart", JSON.stringify(local));
                renderCart(items);
            },
            error: function (xhr) {
                const msg = xhr.responseText || "更新失敗";
                showToast(msg, "warn");
            }
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
            url: `/cart/${id}`,
            method: "DELETE",
            headers: authHeader(),
            success: function (items) {
                let local = items.map(i => ({ title: i.title, price: i.price, qty: i.qty, productId: i.productId }));
                localStorage.setItem("cart", JSON.stringify(local));
                renderCart(items);
                updateNavCartCount(items);
            },
            error: function (xhr) { handleApiError(xhr, "移除失敗"); }
        });
    } else {
        // ⭐ Bug 修正：原本這裡誤用了未定義的 `local`
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.splice(parseInt(id), 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart(cart);
        updateNavCartCount(cart);
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
