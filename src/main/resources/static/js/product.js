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
                    <div class="col-md-4 mb-3">
                        <div class="card recom-card p-3" onclick="location.href='product.html?id=${p.id}'" style="cursor:pointer">
                            <img src="${img}" style="height:120px; object-fit:cover; border-radius:5px; width:100%;">
                            <div class="card-body text-center">
                                <h6 class="text-truncate">${p.title}</h6>
                                <p class="text-danger fw-bold mb-0">NT$ ${p.price}</p>
                            </div>
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

        const qty = parseInt($("#buyQty").val()) || 1;

        // ⭐ 改用 LocalStorage 存儲購物車
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        
        // 檢查是否已有相同商品
        let found = cart.find(item => item.title === currentProduct.title);
        if (found) {
            found.qty += qty;
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
