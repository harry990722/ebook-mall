$(document).ready(function () {
    // ⭐ 只留這個
    loadProducts();
});

// 💡 商品列表
function loadProducts() {
    $.ajax({
        url: "/products",
        method: "GET",
        success: function (data) {
            $("#product-list").empty();

            data.forEach(product => {
                let html = `
                    <div class="col-md-3 mb-5">
                        <div class="card h-100 border-0" onclick="goDetail(${product.id})" style="cursor:pointer">
                            <div class="card-img-placeholder mb-2" style="background:#f5f5f5; padding:40px; border-radius:8px; text-align:center;">
                                <span style="font-size:60px;">📖</span>
                            </div>
                            <div class="card-body p-0">
                                <h5 class="card-title fw-bold mb-1" style="font-size:15px;">
                                    ${product.title}
                                </h5>
                                <p class="card-text text-muted small mb-2">作者：${product.author}</p>
                                <div>
                                    <span style="color:#d00; font-size:16px;">
                                        NT$ ${product.price}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                $("#product-list").append(html);
            });
        },
        error: function () {
            $("#product-list").html('<p class="text-danger text-center">載入失敗</p>');
        }
    });
}

// 跳轉
function goDetail(id) {
    window.location.href = "product.html?id=" + id;
}