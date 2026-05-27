$(document).on("click", "#submitOrder", function () {

    let name    = $("#name").val().trim();
    let address = $("#address").val().trim();
    let payment = $("#paymentMethod").val();
    let agree   = $("#agree").is(":checked");

    if (!name || !address) { showToast("請填寫姓名與地址", "warn"); return; }
    if (!agree)            { showToast("請勾選確認訂單", "warn"); return; }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) { showToast("購物車是空的", "warn"); return; }

    // ⭐ 前置庫存檢查
    let $btn = $("#submitOrder");
    $btn.prop("disabled", true).html('<span class="btn-spinner"></span>檢查庫存...');

    $.get("/products?size=200", function (data) {
        const products = data.content || data;
        let stockError = null;

        for (const item of cart) {
            const product = products.find(p => p.title === item.title);
            if (!product) {
                stockError = `商品「${item.title}」已下架`;
                break;
            }
            if (!product.active) {
                stockError = `商品「${item.title}」已停售`;
                break;
            }
            if (product.stock < item.qty) {
                stockError = `商品「${item.title}」庫存不足，目前剩餘 ${product.stock} 本，您購買 ${item.qty} 本`;
                break;
            }
        }

        if (stockError) {
            showToast(stockError, "warn");
            $btn.prop("disabled", false).html("確認送出訂單");
            setTimeout(() => window.location.href = "cart.html", 1500);
            return;
        }

        // 防止重複建立訂單
        let cartHash = JSON.stringify(cart.map(i => i.title + i.qty));
        if (localStorage.getItem("orderId") && localStorage.getItem("cartHash") === cartHash) {
            window.location.href = payment === "cod" ? "success.html" : "payment.html";
            return;
        }

        $btn.html('<span class="btn-spinner"></span>處理中...');
        sendOrder(name, address, cart, payment);
    }).fail(function () {
        $btn.html('<span class="btn-spinner"></span>處理中...');
        sendOrder(name, address, cart, payment);
    });
});

function sendOrder(name, address, cart, payment) {
    let username = localStorage.getItem("username") || "訪客";
    let total    = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    $.ajax({
        url: "/order",
        method: "POST",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ name, address, payment, total, username, items: cart }),
        success: function (res) {
            let cartHash = JSON.stringify(cart.map(i => i.title + i.qty));
            localStorage.setItem("orderId",  res.id);
            localStorage.setItem("total",    res.total);
            localStorage.setItem("cartHash", cartHash);

            // ⭐ 訂單建立成功 → 立刻清空購物車
            //    這樣不管後續是付款成功還是取消，購物車都不會有殘留
            clearCartEverywhere();

            if (payment === "cod") {
                // 貨到付款：呼叫 /order/cod 設為「待取貨」
                $.ajax({
                    url: "/order/cod/" + res.id,
                    method: "PUT",
                    headers: authHeader(),
                    complete: function () {
                        localStorage.removeItem("orderId");
                        localStorage.removeItem("total");
                        localStorage.removeItem("cartHash");
                        window.location.href = "success.html";
                    }
                });
            } else {
                // 信用卡 / LINE Pay：跳付款頁
                window.location.href = "payment.html";
            }
        },
        error: function (err) {
            let msg = "訂單送出失敗，請稍後再試";
            if (err.responseText && err.status === 400) {
                msg = err.responseText;
            }
            showToast(msg, "warn");
            $("#submitOrder").prop("disabled", false).html("確認送出訂單");

            if (err.status === 401) handleApiError(err, msg);
        }
    });
}

// ⭐ 同時清掉本地 localStorage 和後端購物車
function clearCartEverywhere() {
    localStorage.removeItem("cart");
    // 更新導覽列購物車徽章
    $(".cart-badge").remove();

    // 如已登入，也清掉後端購物車
    if (localStorage.getItem("token")) {
        $.ajax({
            url: "/cart",
            method: "DELETE",
            headers: authHeader()
            // 不需要等回應，背景跑就好
        });
    }
}

function loadCart() {
    let cart  = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;
    $("#checkout-list").empty();
    cart.forEach(item => {
        let sub = item.price * item.qty;
        total += sub;
        $("#checkout-list").append(`
            <tr>
                <td>${item.title}</td>
                <td style="text-align:center">NT$ ${item.price.toLocaleString()}</td>
                <td style="text-align:center">${item.qty}</td>
                <td style="text-align:center;font-weight:700;color:var(--red)">NT$ ${sub.toLocaleString()}</td>
            </tr>
        `);
    });
    $("#totalPrice").text(total.toLocaleString());
}

$(document).ready(function () {
    if (!localStorage.getItem("username")) {
        window.location.href = "login.html";
        return;
    }
    loadCart();
});
