function goDetail(id) {
    window.location.href = "product.html?id=" + id;
}

$(document).ready(function () {
    const id = new URLSearchParams(window.location.search).get("id");
    let currentProduct = null;

    if (!id) {
        document.body.innerHTML = '<div style="text-align:center;padding:80px;font-family:sans-serif"><h2>找不到商品</h2><a href="index.html">返回首頁</a></div>';
        return;
    }

    $.ajax({
        url: "/products/" + id,
        method: "GET",
        success: function (product) {
            if (!product) {
                document.body.innerHTML = '<div style="text-align:center;padding:80px;font-family:sans-serif"><h2>商品不存在</h2><a href="index.html">返回首頁</a></div>';
                return;
            }
            currentProduct = product;
            $("#title").text(product.title);
            $("#author").text(product.author);
            $("#price").text("NT$ " + product.price.toLocaleString());
            $("#oldPrice").text("NT$ " + Math.round(product.price * 1.25).toLocaleString());
            $("#productImage").attr("src", getBookImage(product));
            loadRecommendations(id);
        },
        error: function () {
            showToast("商品載入失敗，請稍後再試", "error");
        }
    });

    function loadRecommendations(currentId) {
        $.get("/products", function (allProducts) {
            const recomDiv = $("#recommendations");
            recomDiv.empty();
            allProducts.filter(p => p.id != currentId).slice(0, 3).forEach(p => {
                recomDiv.append(`
                    <div class="recom-card" onclick="location.href='product.html?id=${p.id}'">
                        <img src="${getBookImage(p)}" class="recom-img" loading="lazy">
                        <div class="recom-body">
                            <div class="recom-title">${p.title}</div>
                            <div class="recom-price">NT$ ${p.price.toLocaleString()}</div>
                        </div>
                    </div>
                `);
            });
        });
    }

    // ⭐ 放入購物車：不跳頁，改用 toast 通知
    $(document).on("click", "#addCart", function () {
        if (!currentProduct) { showToast("商品尚未載入", "warn"); return; }
        const qty = Math.min(Math.max(parseInt($("#buyQty").val()) || 1, 1), 99);
        let cart  = JSON.parse(localStorage.getItem("cart")) || [];
        let found = cart.find(item => item.title === currentProduct.title);
        if (found) {
            found.qty = Math.min(found.qty + qty, 99);
        } else {
            cart.push({ title: currentProduct.title, price: currentProduct.price, qty });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        showToast(`已加入購物車（共 ${cart.reduce((s,i)=>s+i.qty,0)} 件）`, "cart");

        // ⭐ 更新 navbar 購物車數量（不重整頁面）
        let total = cart.reduce((s, i) => s + i.qty, 0);
        $(".cart-badge").text(total).show();
        if (!$(".cart-badge").length) {
            $(".nav-cart").append(`<span class="cart-badge">${total}</span>`);
        }
    });

    // ⭐ 直接購買：跳到結帳頁
    $(document).on("click", "#buyNow", function () {
        if (!currentProduct) { showToast("商品尚未載入", "warn"); return; }
        if (!localStorage.getItem("username")) {
            showToast("請先登入才能購買", "warn");
            setTimeout(() => window.location.href = "login.html", 1200);
            return;
        }
        const qty = Math.min(Math.max(parseInt($("#buyQty").val()) || 1, 1), 99);
        let cart  = JSON.parse(localStorage.getItem("cart")) || [];
        let found = cart.find(item => item.title === currentProduct.title);
        if (found) { found.qty = Math.min(found.qty + qty, 99); }
        else { cart.push({ title: currentProduct.title, price: currentProduct.price, qty }); }
        localStorage.setItem("cart", JSON.stringify(cart));
        window.location.href = "checkout.html";
    });
});
