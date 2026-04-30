$(document).ready(function () {
    // ⭐ 登入檢查
    if (!localStorage.getItem("username")) {
        alert("請先登入！");
        window.location.href = "login.html";
        return;
    }

    // 從 localStorage 取得結帳金額與訂單 ID
    let total = localStorage.getItem("total");
    let orderId = localStorage.getItem("orderId");

    // ⭐ 訂單資料不存在時導回首頁，不讓使用者卡在付款頁
    if (!total || !orderId) {
        alert("找不到訂單資料，請重新操作！");
        window.location.href = "index.html";
        return;
    }

    $("#amount").text(total);

    $("#payBtn").click(function () {
        if (!orderId) {
            alert("訂單資訊已失效，請重新操作！");
            window.location.href = "index.html";
            return;
        }

        // 呼叫後端付款 API（帶上 username 供後端驗證身份）
        let username = localStorage.getItem("username");
        $.ajax({
            url: "/order/pay/" + orderId + "?username=" + encodeURIComponent(username),
            method: "PUT",
            headers: authHeader(),
            success: function () {
                alert("🎉 付款成功！感謝您的訂購。");

                // ⭐ 重點修正：付款成功後，直接清空瀏覽器的購物車資料
                localStorage.removeItem("cart");     // 清空購物車項目
                localStorage.removeItem("orderId");  // 清除當前處理的訂單ID
                localStorage.removeItem("total");    // 清除當前處理的金額

                // 跳轉至成功頁面
                window.location.href = "success.html";
            },
            error: function (err) {
                console.error("付款請求失敗:", err);
                alert("付款失敗，請洽客服人員！");
            }
        });
    });
});
