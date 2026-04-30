let allProducts = [];

$(document).ready(function () {

    // 讀取商品
    $.get("/products", function (data) {
        allProducts = data;
        render(data);
    });

    // 🔍 搜尋
    $("#searchInput").on("keyup", function () {
        let keyword = $(this).val().toLowerCase();

        let filtered = allProducts.filter(p =>
            p.title.toLowerCase().includes(keyword)
        );

        render(filtered);
    });

    // 🏷 分類
    $(".filter-btn").click(function () {
        // 切換按鈕樣式 (誠品風格：被點擊的變深色)
        $(".filter-btn").removeClass("btn-dark").addClass("btn-outline-dark");
        $(this).removeClass("btn-outline-dark").addClass("btn-dark");

        let type = $(this).data("type");

        if (type === "all") {
            render(allProducts);
            return;
        }

        let filtered = allProducts.filter(p => {
            let title = p.title;

            // ⭐ 擴充關鍵字，確保所有新書都能被分類
            if (type === "tech") {
                return title.includes("Java") || title.includes("前端") || title.includes("Spring") || title.includes("Docker") || title.includes("Kubernetes") || title.includes("微服務");
            }
            if (type === "business") {
                return title.includes("致富") || title.includes("財富") || title.includes("原則") || title.includes("理財") || title.includes("心態");
            }
            if (type === "mind") {
                return title.includes("習慣") || title.includes("思考") || title.includes("快思慢想") || title.includes("工作力");
            }

            return true;
        });

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
        <div class="col-6 col-md-3 mb-4">
            <div class="product-card" onclick="goDetail(${p.id})">
                <div class="img-wrap">
                    <span class="discount">79折</span>
                    <img src="${img}" class="product-img">
                </div>
                <div class="book-title">${p.title}</div>
                <div class="book-author">${p.author || ''}</div>
                <div class="mt-1">
                    <span class="price-now">NT$ ${p.price}</span>
                    <span class="price-old">NT$ ${oldPrice}</span>
                </div>
            </div>
        </div>
        `;

        if (isFiltered) {
            // ⭐ 搜尋狀態下：全部塞進主區，不分兩邊
            mainContainer.append(html);
            $(".section-header:eq(1)").hide(); // 隱藏「編輯推薦」標題
        } else {
            // ⭐ 正常狀態下：前 4 本 → 主區，其他 → 推薦區
            $(".section-header:eq(1)").show(); // 顯示標題
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
