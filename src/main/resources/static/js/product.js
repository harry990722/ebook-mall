$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    let currentProduct = null; // ⭐ 存商品資料

    // 1️⃣ 取得商品資料
    $.ajax({
        url: "/products/" + id,
        method: "GET",
        success: function (product) {

            currentProduct = product; // ⭐ 存起來

            $("#title").text(product.title);
            $("#author").text(product.author);
            $("#price").text("NT$ " + product.price);
        }
    });

    // 2️⃣ 加入購物車（AJAX）
    $("#addCart").click(function () {

        if (!currentProduct) {
            alert("商品尚未載入！");
            return;
        }

        let cartItem = {
            id: currentProduct.id,
            title: currentProduct.title,
            price: currentProduct.price,
            qty: 1
        };

        $.ajax({
            url: "/cart",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(cartItem),

            success: function (res) {
                console.log("加入成功！");
				// 成功加入後跳轉
				window.location.assign("cart.html"); 
            },

            error: function () {
                alert("加入失敗！");
            }
        });

    });

});