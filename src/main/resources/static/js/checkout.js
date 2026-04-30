$(document).on("click", "#submitOrder", function () {

let name = $("#name").val().trim();
let address = $("#address").val().trim();
let payment = $("#paymentMethod").val();
let agree = $("#agree").is(":checked");

if (!name || !address) {
    alert("❌ 請填寫收件資訊！");
    return;
}

if (!agree) {
    alert("❌ 請勾選確認訂單");
    return;
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];
if (cart.length === 0) {
    alert("購物車為空！");
    return;
}

sendOrder(name, address, cart, payment);

});

function sendOrder(name, address, cart, payment) {
let username = localStorage.getItem("username") || "訪客";
let total = 0;

cart.forEach(item => total += item.price * item.qty);

let orderData = {
    name: name,
    address: address,
    payment: payment,   // ⭐ 新增
    total: total,
    username: username,
    items: cart
};

$.ajax({
    url: "/order",
    method: "POST",
    contentType: "application/json",
    headers: authHeader(),
    data: JSON.stringify(orderData),
    success: function (res) {
        // ⭐ 不在這裡清購物車，等付款成功後再清（payment.js 負責）
        // 這樣「稍後再付」回首頁時，購物車還會保留
        localStorage.setItem("orderId", res.id);
        localStorage.setItem("total", res.total);
        window.location.href = "payment.html";
    },
    error: function (err) {
        console.error("訂單送出失敗:", err);
        alert("❌ 訂單送出失敗，請確認網路連線或聯繫客服！");
    }
});

}

function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;
    $("#checkout-list").empty();
    cart.forEach(item => {
        let sub = item.price * item.qty;
        total += sub;
        $("#checkout-list").append(`<tr><td>${item.title}</td><td>NT$ ${item.price}</td><td>${item.qty}</td><td>NT$ ${sub}</td></tr>`);
    });
    $("#totalPrice").text(total);
}

$(document).ready(function () {
    if (!localStorage.getItem("username")) { window.location.href = "login.html"; return; }
    loadCart();
});

