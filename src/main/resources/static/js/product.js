function goDetail(id) {
    window.location.href = "product.html?id=" + id;
}

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    let currentProduct = null;

    if (id) {
        $.ajax({
            url: "/products/" + id,
            method: "GET",
            success: function (product) {
                currentProduct = product;
                $("#title").text(product.title);
                $("#author").text(product.author);
                $("#price").text("NT$ " + product.price);
                $("#oldPrice").text("NT$ " + Math.round(product.price * 1.2));

                // ⭐ 使用 common.js 的圖片邏輯
                let imgUrl = getBookImage(product.title);
                $("#productImage").attr("src", imgUrl);

                loadRecommendations(id);
            },
            error: function () {
                alert("商品載入失敗");
            }
        });
    }

    function loadRecommendations(currentId) {
        $.get("/products", function (allProducts) {
            const recomDiv = $("#recommendations");
            recomDiv.empty();
            const others = allProducts.filter(p => p.id != currentId).slice(0, 3);

            others.forEach(p => {
                let img = getBookImage(p.title);
                recomDiv.append(`
                    <div class="recom-card" onclick="location.href='product.html?id=${p.id}'">
                        <img src="${img}" class="recom-img" loading="lazy">
                        <div class="recom-body">
                            <div class="recom-title">${p.title}</div>
                            <div class="recom-price">NT$ ${p.price}</div>
                        </div>
                    </div>
                `);
            });
        });
    }

    $(document).on("click", "#addCart", function () {
        handleAction("cart.html");
    });

    $(document).on("click", "#buyNow", function () {
        handleAction("checkout.html");
    });

    function handleAction(targetUrl) {
        if (!currentProduct) {
            alert("商品尚未載入！");
            return;
        }

        let username = localStorage.getItem("username");
        if (targetUrl === "checkout.html" && !username) {
            alert("請先登入會員才能進行購買！");
            window.location.href = "login.html";
            return;
        }

        const qty = Math.min(Math.max(parseInt($("#buyQty").val()) || 1, 1), 99); // ⭐ 限制 1~99

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        
        let found = cart.find(item => item.title === currentProduct.title);
        if (found) {
            found.qty = Math.min(found.qty + qty, 99); // ⭐ 加入後總數也不超過 99
        } else {
            cart.push({
                title: currentProduct.title,
                price: currentProduct.price,
                qty: qty
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.location.href = targetUrl;
    }
});
