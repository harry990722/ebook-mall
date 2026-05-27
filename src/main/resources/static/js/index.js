let allProducts  = [];
let currentPage  = 0;
let totalPages   = 0;
let currentType  = "";
let currentKeyword = "";
const PAGE_SIZE  = 8;

// ===== 動態 Banner（手動切換版本，不依賴 Bootstrap Carousel） =====
let bannerData = [];
let bannerCurrent = 0;
let bannerTimer = null;

function loadBanners() {
    $.get("/banners", function (banners) {
        console.log("[Banner] 載入", banners.length, "張", banners.map(b => b.imageUrl));
        if (!banners || banners.length === 0) return;

        bannerData = banners;
        bannerCurrent = 0;

        // 建立指示點
        let indicators = "";
        banners.forEach((b, i) => {
            indicators += `<button type="button" data-idx="${i}" ${i===0 ? 'class="active"' : ''}></button>`;
        });
        $("#bannerIndicators").html(indicators);

        // 只渲染當前這一張（之後切換時動態換 src）
        $("#bannerInner").html(`
            <div class="carousel-item active" id="banner-current-slide">
                <img id="banner-current-img" src="${banners[0].imageUrl}" alt="">
            </div>
        `);

        // 設定第一張文字
        $("#bannerTitle").text(banners[0].title || "");
        $("#bannerSubtitle").text(banners[0].subtitle || "");

        // 點擊指示點
        $("#bannerIndicators button").off("click").on("click", function () {
            const idx = parseInt($(this).attr("data-idx"));
            console.log("[Banner] 點擊指示點", idx, "→ 切換成", bannerData[idx].imageUrl);
            showBannerSlide(idx);
            resetBannerTimer();
        });

        // 自動輪播
        startBannerTimer();

    }).fail(function () {
        $("#bannerInner").html(`
            <div class="carousel-item active">
                <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=80" alt="書城">
            </div>`);
        $("#bannerTitle").text("📚 電子書商城精選好書");
        $("#bannerSubtitle").text("技術・商業・心理學，每本都是你的競爭力");
    });
}

function showBannerSlide(idx) {
    if (!bannerData[idx]) return;
    const b = bannerData[idx];
    bannerCurrent = idx;

    // 直接換圖片 src
    $("#banner-current-img").attr("src", b.imageUrl);
    $("#bannerTitle").text(b.title || "");
    $("#bannerSubtitle").text(b.subtitle || "");

    // 同步指示點
    $("#bannerIndicators button").removeClass("active");
    $(`#bannerIndicators button[data-idx="${idx}"]`).addClass("active");
}

function startBannerTimer() {
    if (bannerTimer) clearInterval(bannerTimer);
    bannerTimer = setInterval(function () {
        const next = (bannerCurrent + 1) % bannerData.length;
        showBannerSlide(next);
    }, 4500);
}

function resetBannerTimer() {
    startBannerTimer();
}

// ===== 銷售排行 =====
function loadRanking() {
    $.get("/products/ranking?top=5", function (list) {
        const $wrap = $("#ranking-list");
        $wrap.empty();

        if (!list || list.length === 0) {
            $("#ranking-header").hide();
            return;
        }

        list.forEach(item => {
            const rankClass = item.rank <= 3 ? `rank-${item.rank}` : "rank-other";
            const img = item.imageUrl
                ? `<img src="${item.imageUrl}" class="ranking-img" loading="lazy">`
                : `<div class="ranking-img" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">📚</div>`;

            const onclick = item.productId ? `onclick="goDetail(${item.productId})"` : "";

            $wrap.append(`
            <div class="ranking-item" ${onclick}>
                <div class="rank-badge ${rankClass}">${item.rank}</div>
                ${img}
                <div class="ranking-info">
                    <div class="ranking-title">${item.title}</div>
                    <div class="ranking-sub">NT$ ${item.price.toLocaleString()} ／ 本</div>
                </div>
                <div class="ranking-stat">
                    <div class="ranking-qty">${item.totalQty}</div>
                    <div class="ranking-qty-label">已售出</div>
                </div>
            </div>`);
        });
    }).fail(function () {
        $("#ranking-header").hide();
    });
}


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

        // ⭐ 庫存標籤
        const stock = p.stock != null ? p.stock : 0;
        let stockBadge = "";
        let cardStyle = "";
        if (stock === 0) {
            stockBadge = `<div style="position:absolute;top:8px;right:8px;background:rgba(229,62,62,0.95);color:white;padding:4px 10px;border-radius:50px;font-size:0.72rem;font-weight:700;z-index:2">已售完</div>`;
            cardStyle = "opacity:0.6";
        } else if (stock < 10) {
            stockBadge = `<div style="position:absolute;top:8px;right:8px;background:rgba(201,168,76,0.95);color:white;padding:4px 10px;border-radius:50px;font-size:0.72rem;font-weight:700;z-index:2">僅剩 ${stock}</div>`;
        }

        let html = `
        <div class="product-card" onclick="goDetail(${p.id})" style="${cardStyle}">
            <div class="pcard-img-wrap">
                <span class="pcard-discount">79折</span>
                ${stockBadge}
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
    loadBanners();   // ⭐ 動態 Banner
    loadRanking();   // ⭐ 銷售排行
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
