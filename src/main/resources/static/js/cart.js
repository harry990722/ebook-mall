$(document).ready(function () {
    loadCart();
});

function loadCart() {
let cart = JSON.parse(localStorage.getItem("cart")) || [];
$("#cart-list").empty();
let total = 0;

if (cart.length === 0) {
    $("#cart-list").append('<tr><td colspan="5" class="text-center">購物車是空的</td></tr>');
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

            <td class="text-center">NT$ ${item.price}</td>

            <td class="text-center">
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">−</button>
                    <span class="qty-num">${item.qty || 1}</span>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
            </td>

            <td class="text-center text-danger fw-bold">
                NT$ ${subtotal}
            </td>

            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm"
                    onclick="removeItem(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
        `;

        $("#cart-list").append(html);
    });
}

// ⭐ 這行你剛剛少了
$("#totalPrice").text(total);

}

// ✅ 數量增減
function updateQty(index, change) {
let cart = JSON.parse(localStorage.getItem("cart")) || [];
cart[index].qty = (cart[index].qty || 1) + change;

if (cart[index].qty <= 0) cart.splice(index, 1);

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