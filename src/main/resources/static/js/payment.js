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

        // ⭐ Loading 狀態
        let $btn = $("#payBtn");
        $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-2"></span>付款處理中...');

        let username = localStorage.getItem("username");
        $.ajax({
            url: "/order/pay/" + orderId + "?username=" + encodeURIComponent(username),
            method: "PUT",
            headers: authHeader(),
            success: function () {
                alert("🎉 付款成功！感謝您的訂購。");
                localStorage.removeItem("cart");
                localStorage.removeItem("orderId");
                localStorage.removeItem("total");
                localStorage.removeItem("cartHash"); // ⭐ 清掉購物車 hash
                window.location.href = "success.html";
            },
            error: function (err) {
                console.error("付款請求失敗:", err);
                alert("付款失敗，請洽客服人員！");
                // ⭐ 恢復按鈕
                $btn.prop("disabled", false).html("立即付款");
            }
        });
    });
});
