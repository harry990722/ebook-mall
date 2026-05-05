let allProducts = [];

// ⭐ Skeleton loading HTML
function showSkeleton() {
    let skeletonHtml = '';
    for (let i = 0; i < 4; i++) {
        skeletonHtml += `
        <div class="col-6 col-md-3 mb-4">
            <div style="padding:10px">
                <div style="width:100%;aspect-ratio:3/4;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.2s infinite;border-radius:6px"></div>
                <div style="height:16px;background:#f0f0f0;border-radius:4px;margin-top:12px;animation:shimmer 1.2s infinite"></div>
                <div style="height:14px;background:#f0f0f0;border-radius:4px;margin-top:8px;width:60%;animation:shimmer 1.2s infinite"></div>
            </div>
        </div>`;
    }
    $("#product-list").html(skeletonHtml);
    // 加入 shimmer 動畫
    if (!document.getElementById("shimmerStyle")) {
        let style = document.createElement("style");
        style.id = "shimmerStyle";
        style.textContent = "@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}";
        document.head.appendChild(style);
    }
}

$(document).ready(function () {

    showSkeleton();

    // 讀取商品
    $.get("/products", function (data) {
        allProducts = data;
        render(data);
    });

    // 🔍 搜尋（書名 + 作者）
    $("#searchInput").on("keyup", function () {
        let keyword = $(this).val().toLowerCase();
        let filtered = allProducts.filter(p =>
            p.title.toLowerCase().includes(keyword) ||
            (p.author && p.author.toLowerCase().includes(keyword))
        );
        render(filtered);
    });

    // 🏷 分類
    $(".filter-btn").click(function () {
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");

        let type = $(this).data("type");
        if (type === "all") { render(allProducts); return; }

        let filtered = allProducts.filter(p => p.type === type);
        render(filtered);
    });

});

function render(list) {

    const mainContainer = $("#product-list");
    const subContainer = $("#product-list-2");

    mainContainer.empty();
    subContainer.empty();

    if (list.length === 0) {
        mainContainer.append('<div class="col-12 text-center py-5 text-muted">找不到符合條件的書籍</div>');
        return;
    }

    // 判斷是否在搜尋/分類模式
    // 如果是過濾後的結果，通常我們會把所有結果排在一起，不分兩區
    const isFiltered = list.length !== allProducts.length;

    list.forEach((p, index) => {

        let img = getBookImage(p.title);
        let oldPrice = Math.round(p.price * 1.25);

        let html = `
        <div class="product-card" onclick="goDetail(${p.id})">
            <div class="pcard-img-wrap">
                <span class="pcard-discount">79折</span>
                <img src="${img}" class="pcard-img" loading="lazy">
            </div>
            <div class="pcard-body">
                <div class="pcard-title">${p.title}</div>
                <div class="pcard-author">${p.author || ''}</div>
                <div class="pcard-price">
                    <span class="pcard-now">NT$ ${p.price}</span>
                    <span class="pcard-old">NT$ ${oldPrice}</span>
                </div>
            </div>
        </div>
        `;

        if (isFiltered) {
            mainContainer.append(html);
            $("#recom-header").hide();
        } else {
            $("#recom-header").show();
            if (index < 4) {
                mainContainer.append(html);
            } else {
                subContainer.append(html);
            }
        }
    });
}

// 📘 跳轉商品頁
function goDetail(id) {
    location.href = "product.html?id=" + id;
}
