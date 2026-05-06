function updateCartBadge(count) {
    let badge = $(".cart-badge");
    if (count > 0) {
        if (badge.length) badge.text(count);
        else $(".nav-cart").append(`<span class="cart-badge">${count}</span>`);
    } else badge.remove();
}

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
            loadReviews(id); // ⭐ 載入評論
        },
        error: function () {
            showToast("商品載入失敗，請稍後再試", "error");
        }
    });

    function loadRecommendations(currentId) {
        // ⭐ 分頁 API 回傳 { content: [...] }，取 content 陣列
        $.get("/products", { page: 0, size: 20 }, function (res) {
            const allProducts = res.content || res; // 相容舊格式
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

    // ⭐ 放入購物車
    $(document).on("click", "#addCart", function () {
        if (!currentProduct) { showToast("商品尚未載入", "warn"); return; }
        const qty = Math.min(Math.max(parseInt($("#buyQty").val()) || 1, 1), 99);

        if (localStorage.getItem("token")) {
            // 登入：同步後端
            $.ajax({
                url: "/cart", method: "POST",
                contentType: "application/json", headers: authHeader(),
                data: JSON.stringify({ productId: currentProduct.id, qty }),
                success: function (items) {
                    let local = items.map(i => ({ title: i.title, price: i.price, qty: i.qty, productId: i.productId }));
                    localStorage.setItem("cart", JSON.stringify(local));
                    let total = items.reduce((s, i) => s + i.qty, 0);
                    showToast(`已加入購物車（共 ${total} 件）`, "cart");
                    updateCartBadge(total);
                },
                error: function (xhr) { handleApiError(xhr, "加入失敗"); }
            });
        } else {
            // 未登入：存 localStorage
            let cart  = JSON.parse(localStorage.getItem("cart")) || [];
            let found = cart.find(item => item.title === currentProduct.title);
            if (found) { found.qty = Math.min(found.qty + qty, 99); }
            else { cart.push({ title: currentProduct.title, price: currentProduct.price, qty }); }
            localStorage.setItem("cart", JSON.stringify(cart));
            let total = cart.reduce((s, i) => s + i.qty, 0);
            showToast(`已加入購物車（共 ${total} 件）`, "cart");
            updateCartBadge(total);
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

// ===== 評論系統 =====
let currentProductId = null;

function loadReviews(productId) {
    currentProductId = productId;
    $.get(`/products/${productId}/reviews`, function (data) {
        renderStars(data.avgRating, data.count);
        renderReviews(data.reviews);
    });
}

function renderStars(avg, count) {
    let full  = Math.floor(avg);
    let half  = avg - full >= 0.5;
    let empty = 5 - full - (half ? 1 : 0);
    let stars = "★".repeat(full) + (half ? "⭐" : "") + "☆".repeat(empty);
    $("#avg-rating").text(avg.toFixed(1));
    $("#star-display").text(stars);
    $("#review-count").text(`（${count} 則評論）`);
}

function renderReviews(reviews) {
    let $list = $("#review-list");
    $list.empty();

    let username = localStorage.getItem("username");
    let role     = localStorage.getItem("role");  // ⭐ 取得角色

    if (reviews.length === 0) {
        $list.html('<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:0.9rem">還沒有評論，成為第一個評論的人吧！</div>');
        return;
    }

    reviews.forEach(r => {
        let stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        let date  = new Date(r.createdAt).toLocaleDateString("zh-TW");
        // ⭐ 自己的評論 or admin 都可以看到刪除按鈕
        let canDelete = r.username === username || role === "admin";
        $list.append(`
        <div class="review-item">
            <div class="review-header">
                <span class="review-user">👤 ${r.username}</span>
                <span class="review-stars" style="color:#f59e0b">${stars}</span>
                <span class="review-date">${date}</span>
                ${canDelete ? `<button class="review-del-btn" onclick="deleteReview(${r.id})">刪除</button>` : ""}
            </div>
            <div class="review-content">${r.content}</div>
        </div>`);
    });
}

function submitReview() {
    if (!localStorage.getItem("token")) {
        showToast("請先登入才能評論", "warn");
        setTimeout(() => window.location.href = "login.html", 1200);
        return;
    }

    let rating  = parseInt($("#review-rating").val());
    let content = $("#review-content").val().trim();
    if (!content) { showToast("請輸入評論內容", "warn"); return; }

    let $btn = $("#submit-review-btn");
    $btn.prop("disabled", true).text("送出中...");

    $.ajax({
        url: `/products/${currentProductId}/reviews`,
        method: "POST",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ rating, content }),
        success: function () {
            showToast("評論已送出！", "success");
            $("#review-content").val("");
            $("#review-rating").val("5");
            loadReviews(currentProductId);
        },
        error: function (xhr) {
            if (xhr.status === 400) showToast(xhr.responseText, "warn");
            else handleApiError(xhr, "送出失敗");
        },
        complete: function () { $btn.prop("disabled", false).text("送出評論"); }
    });
}

function deleteReview(id) {
    if (!confirm("確定要刪除這則評論嗎？")) return;
    $.ajax({
        url: `/reviews/${id}`, method: "DELETE", headers: authHeader(),
        success: function () {
            showToast("評論已刪除", "info");
            loadReviews(currentProductId);
        },
        error: function (xhr) { handleApiError(xhr, "刪除失敗"); }
    });
}
