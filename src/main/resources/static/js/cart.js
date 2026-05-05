$(document).ready(function () {
    loadCart();
});

function loadCart() {
let cart = JSON.parse(localStorage.getItem("cart")) || [];
$("#cart-list").empty();
let total = 0;

// ⭐ 千分位格式
function fmt(n) { return n.toLocaleString(); }

if (cart.length === 0) {
    $("#cart-list").append(`
        <tr><td colspan="5">
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <p>購物車是空的，快去挑選喜歡的書吧！</p>
            </div>
        </td></tr>
    `);
} else {
    cart.forEach((item, index) => {
        let subtotal = item.price * (item.qty || 1);
        total += subtotal;

        let html = `
        <tr>
            <td>
                <div class="fw-bold">${item.title}</div>
                <small class="text-muted">電子書</small>
            </td>

            <td class="text-center">NT$ ${fmt(item.price)}</td>

            <td class="text-center">
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">−</button>
                    <span class="qty-num">${item.qty || 1}</span>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
            </td>

            <td class="text-center text-danger fw-bold">
                NT$ ${fmt(subtotal)}
            </td>

            <td style="text-align:center">
                <button class="trash-btn" onclick="removeItem(${index})" title="移除">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
            </td>
        </tr>
        `;

        $("#cart-list").append(html);
    });
}

$("#totalPrice").text(total.toLocaleString());
}

// ✅ 數量增減（上限 99，下限 1）
function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let newQty = (cart[index].qty || 1) + change;

    if (newQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].qty = Math.min(newQty, 99); // ⭐ 上限 99
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// ✅ 刪除商品
function removeItem(index) {
if (!confirm("確定要刪除嗎？")) return;

let cart = JSON.parse(localStorage.getItem("cart")) || [];
cart.splice(index, 1);

localStorage.setItem("cart", JSON.stringify(cart));
loadCart();

}