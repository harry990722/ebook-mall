// ⭐ 搬到最外面，確保 HTML onclick 抓得到
function validateAndSend(event) {
    if (event) {
        event.preventDefault();
    }

    console.log("--- 執行攔截檢查 ---");

    let name = $("#name").val().trim();
    let address = $("#address").val().trim();

    if (!name) {
        alert("❌ 請輸入收件人姓名！");
        $("#name").focus();
        return false;
    }

    if (!address) {
        alert("❌ 請輸入收件地址！");
        $("#address").focus();
        return false;
    }

    // 檢查通過後執行發送
    sendOrder(name, address);
}

function sendOrder(name, address) {
    let username = localStorage.getItem("username") || "訪客";

    $.get("/cart", function (cart) {
        if (!cart || cart.length === 0) {
            alert("購物車內沒有商品！");
            return;
        }

        let total = 0;
        cart.forEach(item => total += item.price * (item.qty || 1));

        let orderData = {
            name: name,
            address: address,
            total: total,
            username: username,
            items: cart
        };

        $.ajax({
            url: "/order",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(orderData),
            success: function (res) {
                // ⭐ 修正這裡：名稱要改為 "total"，payment.js 才抓得到
                localStorage.setItem("orderId", res.id);
                localStorage.setItem("total", res.total); 
                
                alert("訂單建立成功！");
                window.location.href = "payment.html";
            },
            error: function () {
                alert("發送訂單失敗");
            }
        });
    });
}

function loadCart() {
    $.get("/cart", function (cart) {
        let total = 0;
        $("#checkout-list").empty();
        if (cart) {
            cart.forEach(item => {
                let sub = item.price * (item.qty || 1);
                total += sub;
                $("#checkout-list").append(`<tr><td>${item.title}</td><td>NT$ ${item.price}</td><td>${item.qty}</td><td>NT$ ${sub}</td></tr>`);
            });
        }
        $("#totalPrice").text(total);
    });
}

$(document).ready(function () {
    // ⭐ 強制檢查：沒登入就踢回登入頁
    let username = localStorage.getItem("username");
    if (!username) {
        alert("結帳前請先登入！");
        window.location.href = "login.html";
        return;
    }

    loadCart();
});
