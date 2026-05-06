let allProducts  = [];
let currentPage  = 0;
let totalPages   = 0;
let currentType  = "";
let currentKeyword = "";
const PAGE_SIZE  = 8;

// Skeleton loading
function showSkeleton() {
    let html = '';
    for (let i = 0; i < PAGE_SIZE; i++) {
        html += `<div class="product-card" style="pointer-events:none">
            <div class="pcard-img-wrap" style="background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.2s infinite"></div>
            <div class="pcard-body">
                <div style="height:14px;background:#f0f0f0;border-radius:4px;margin-bottom:8px;animation:shimmer 1.2s infinite"></div>
                <div style="height:12px;background:#f0f0f0;border-radius:4px;width:60%;animation:shimmer 1.2s infinite"></div>
            </div>
        </div>`;
    }
    $("#product-list").html(html);
    if (!document.getElementById("shimmerStyle")) {
        let s = document.createElement("style");
        s.id = "shimmerStyle";
        s.textContent = "@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}";
        document.head.appendChild(s);
    }
}

function loadProducts(page = 0) {
    currentPage = page;
    showSkeleton();
    $("#product-list-2").empty();
    $("#recom-header").hide();
    hidePagination();

    $.get("/products", {
        page: page, size: PAGE_SIZE,
        type: currentType, keyword: currentKeyword
    }, function (res) {
        allProducts = res.content;
        totalPages  = res.totalPages;
        renderProducts(res.content);
        renderPagination(res.currentPage, res.totalPages, res.totalItems);
    }).fail(function () {
        $("#product-list").html('<div style="text-align:center;padding:48px;color:var(--text-muted)">❌ 載入失敗，請重新整理</div>');
    });
}

function renderProducts(list) {
    const mainContainer = $("#product-list");
    mainContainer.empty();

    if (list.length === 0) {
        mainContainer.html('<div style="grid-column:1/-1;text-align:center;padding:64px;color:var(--text-muted)">找不到符合條件的書籍</div>');
        return;
    }

    list.forEach(p => {
        let img = getBookImage(p);
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
                    <span class="pcard-now">NT$ ${p.price.toLocaleString()}</span>
                    <span class="pcard-old">NT$ ${oldPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>`;
        mainContainer.append(html);
    });
}

function renderPagination(current, total, totalItems) {
    if (total <= 1) { hidePagination(); return; }
    $("#pagination-wrap").show();
    $("#total-items").text(`共 ${totalItems} 本`);

    let html = '';
    html += `<button class="page-btn" onclick="loadProducts(${current - 1})" ${current === 0 ? 'disabled' : ''}>‹</button>`;
    for (let i = 0; i < total; i++) {
        if (total > 7 && i > 1 && i < total - 2 && Math.abs(i - current) > 1) {
            if (i === 2 || i === total - 3) html += `<span class="page-dots">…</span>`;
            continue;
        }
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadProducts(${i})">${i + 1}</button>`;
    }
    html += `<button class="page-btn" onclick="loadProducts(${current + 1})" ${current === total - 1 ? 'disabled' : ''}>›</button>`;
    $("#pagination-btns").html(html);
}

function hidePagination() { $("#pagination-wrap").hide(); }

$(document).ready(function () {
    loadProducts(0);

    // 搜尋（帶分頁重置）
    let searchTimer;
    $("#searchInput").on("keyup", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentKeyword = $(this).val().trim();
            loadProducts(0);
        }, 350);
    });

    // 分類
    $(".filter-btn").click(function () {
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");
        currentType = $(this).data("type") === "all" ? "" : $(this).data("type");
        currentKeyword = "";
        $("#searchInput").val("");
        loadProducts(0);
    });
});

function goDetail(id) { location.href = "product.html?id=" + id; }
