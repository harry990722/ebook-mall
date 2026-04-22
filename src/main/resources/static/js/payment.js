$(document).ready(function () {

    // 從 localStorage 取得 checkout.js 存入的資料
    let total = localStorage.getItem("total");
    let orderId = localStorage.getItem("orderId");

    // 檢查資料是否存在，若無則跳回首頁
    if (!total || !orderId) {
        $("#amount").text("資料讀取中...");
        console.error("找不到訂單資料");
    } else {
        $("#amount").text(total);
    }

    $("#payBtn").click(function () {

        if (!orderId) {
            alert("訂單資訊已失效，請重新操作！");
            window.location.href = "index.html";
            return;
        }

        // 呼叫後端付款 API
        $.ajax({
            url: "/order/pay/" + orderId,
            method: "PUT",
            success: function () {
                alert("付款成功！感謝您的訂購。");

                // ⭐ 成功付款後：清空後端購物車快取
                $.ajax({
                    url: "/cart/clear",
                    method: "DELETE",
                    complete: function() {
                        // 無論清空成功與否，都清除本地暫存並跳轉
                        localStorage.removeItem("orderId");
                        localStorage.removeItem("total");
                        window.location.href = "success.html";
                    }
                });
            },
            error: function (err) {
                console.error("付款請求失敗:", err);
                alert("付款失敗，請洽客服人員！");
            }
        });
    });
});
