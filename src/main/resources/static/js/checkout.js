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

// ⭐ 防止重複建立訂單：
// 若已有 orderId，且購物車 hash 相同，直接跳付款頁不重新建立
let cartHash = JSON.stringify(cart.map(i => i.title + i.qty));
let savedHash = localStorage.getItem("cartHash");
let existingOrderId = localStorage.getItem("orderId");

if (existingOrderId && savedHash === cartHash) {
    window.location.href = "payment.html";
    return;
}

let $btn = $("#submitOrder");
$btn.prop("disabled", true).html('<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:8px"></span>處理中...');

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
        let cartHash = JSON.stringify(cart.map(i => i.title + i.qty));
        localStorage.setItem("orderId", res.id);
        localStorage.setItem("total", res.total);
        localStorage.setItem("cartHash", cartHash); // ⭐ 記錄購物車狀態，防止重複建單
        window.location.href = "payment.html";
    },
    error: function (err) {
        console.error("訂單送出失敗:", err);
        alert("❌ 訂單送出失敗，請確認網路連線或聯繫客服！");
        // ⭐ 恢復按鈕
        $("#submitOrder").prop("disabled", false).html("確認並送出訂單");
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

