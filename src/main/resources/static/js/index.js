$(document).ready(function () {
    loadProducts();
});

function loadProducts() {
    $.ajax({
        url: "/products",
        method: "GET",
        success: function (data) {
            $("#product-list").empty();

            data.forEach(product => {

                // ⭐ 隨機書本圖片（你也可以改成資料庫圖片）
                let img = getBookImage(product.title);

                let html = `
                    <div class="col-md-3 mb-4">
                        <div class="card h-100" onclick="goDetail(${product.id})" style="cursor:pointer">

                            <img src="${img}" class="book-img">

                            <div class="card-body">
                                <h6 class="fw-bold">${product.title}</h6>
                                <p class="text-muted small">作者：${product.author}</p>
                                <div class="price">NT$ ${product.price}</div>
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

// ⭐ 書本圖片（重點🔥）
function getBookImage(title) {

    if (title.includes("Java")) {
        return "https://images.unsplash.com/photo-1515879218367-8466d910aaa4";
    }
    if (title.includes("Spring")) {
        return "https://images.unsplash.com/photo-1555066931-4365d14bab8c";
    }
    if (title.includes("前端")) {
        return "https://images.unsplash.com/photo-1498050108023-c5249f4df085";
    }

    // 預設
    return "https://images.unsplash.com/photo-1512820790803-83ca734da794";
}

function goDetail(id) {
    window.location.href = "product.html?id=" + id;
}