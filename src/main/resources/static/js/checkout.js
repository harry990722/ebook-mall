$(document).ready(function () {
    loadCart();
});

// 1. 載入購物車
function loadCart() {
    $.ajax({
        url: "/cart",
        method: "GET",
        success: function (cart) {
            let total = 0;
            $("#checkout-list").empty();

            cart.forEach(item => {
                let qty = item.qty || 1;
                let subtotal = item.price * qty;
                total += subtotal;

                let html = `
                    <tr>
                        <td>${item.title}</td>
                        <td>${item.price}</td>
                        <td>${qty}</td>
                        <td>${subtotal}</td>
                    </tr>
                `;
                $("#checkout-list").append(html);
            });
            $("#totalPrice").text(total);
        }
    });
}

// 2. 送出訂單 (修正重點：加入 username 參數與清空邏輯)
// 2. 送出訂單 (更新：先抓購物車內容再一併送出)
$("#submitOrder").click(function () {

    let username = localStorage.getItem("username");

    // 第一步：先向後端請求最新的購物車內容
    $.ajax({
        url: "/cart", // 建議用相對路徑，或維持你指定的 http://localhost:8888/cart
        method: "GET",
        success: function (cart) {

            let total = 0;
            // 重新計算總金額以確保準確
            cart.forEach(item => {
                total += item.price * (item.qty || 1);
            });

            // 第二步：打包所有資料，包含 items 列表
            let orderData = {
                name: $("#name").val(),
                address: $("#address").val(),
                total: total,
                username: username,
                items: cart // ⭐ 關鍵：將購物車清單直接塞入 order 的 items 欄位
            };

            // 第三步：正式送出訂單
            $.ajax({
                url: "/order", 
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(orderData),

                success: function (res) {
                    console.log("訂單建立成功：", res);

                    // 存下回傳的訂單 ID 與金額，供 payment.html 使用
                    localStorage.setItem("orderId", res.id);
                    localStorage.setItem("total", res.total);

                    alert("訂單建立成功！");
                    window.location.href = "payment.html";
                },
                error: function (err) {
                    console.error("送出失敗：", err);
                    alert("訂單送出失敗，請檢查資料！");
                }
            });
        },
        error: function (err) {
            alert("無法取得購物車內容，請重新整理頁面。");
        }
    });
});

// 3. 清空購物車
function clearCart() {
    $.ajax({
        url: "/cart/clear",
        method: "DELETE",
        success: function () {
            // 清空後跳轉回首頁
            window.location.href = "index.html";
        },
        error: function() {
            // 即使清空 API 失敗，為了用戶體驗通常還是會跳轉
            window.location.href = "index.html";
        }
    });

}
