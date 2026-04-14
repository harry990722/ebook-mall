$(document).ready(function () {

    let total = localStorage.getItem("total");
    let orderId = localStorage.getItem("orderId");

    $("#amount").text(total);

    $("#payBtn").click(function () {

        if (!orderId) {
            alert("訂單不存在！");
            window.location.href = "index.html";
            return;
        }

        $.ajax({
            url: "/order/pay/" + orderId,
            method: "PUT",

            success: function () {

                alert("付款成功！");

                // ⭐ 清空購物車
                $.ajax({
                    url: "/cart/clear",
                    method: "DELETE"
                });

                localStorage.removeItem("orderId");
                localStorage.removeItem("total");

                window.location.href = "success.html";
            },

            error: function () {
                alert("付款失敗！");
            }
        });

    });

});