let allProducts = [];
let allOrders   = [];
let deleteTargetId = null;
let currentTab = "dashboard";
let statusChart = null;

$(document).ready(function () {

    // ===== 權限檢查 =====
    let username = localStorage.getItem("username");
    let role     = localStorage.getItem("role");
    if (!username || !localStorage.getItem("token")) {
        alert("請先登入！"); window.location.href = "login.html"; return;
    }
    if (role !== "admin") {
        alert("⛔ 您沒有權限進入後台！"); window.location.href = "index.html"; return;
    }
    $("#adminUser").text(username);

    loadDashboard(); // ⭐ 預設載入儀表板

    // Tab 切換
    $(document).on("click", ".tab-btn", function () {
        $(".tab-btn").removeClass("active");
        $(this).addClass("active");
        currentTab = $(this).data("tab");
        $("#dashboard-section, #products-section, #orders-section, #banners-section, #messages-section").hide();

        const titleMap = {
            dashboard: "儀表板",
            products:  "商品管理",
            orders:    "訂單管理",
            banners:   "Banner 管理",
            messages:  "客服留言"
        };
        $("#pageTitle").text(titleMap[currentTab] || "後台管理");

        if (currentTab === "dashboard") {
            $("#dashboard-section").show(); loadDashboard();
        } else if (currentTab === "products") {
            $("#products-section").show(); loadProducts();
        } else if (currentTab === "orders") {
            $("#orders-section").show(); loadOrders();
        } else if (currentTab === "banners") {
            $("#banners-section").show(); loadBanners();
        } else if (currentTab === "messages") {
            $("#messages-section").show(); loadMessages();
        }
    });

    // 登出
    $("#adminLogout").click(function () {
        if (!confirm("確定要登出嗎？")) return;
        // ⭐ 統一登出流程：通知後端撤銷 Refresh Token，再清乾淨本地
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
            $.ajax({
                url: "/logout",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ refreshToken: refreshToken }),
                complete: function () { doAdminLogoutCleanup(); }
            });
        } else {
            doAdminLogoutCleanup();
        }
    });

    function doAdminLogoutCleanup() {
        // 雙 Token + 舊版相容
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        // 訂單暫存
        localStorage.removeItem("orderId");
        localStorage.removeItem("total");
        localStorage.removeItem("cartHash");
        // 方案 B：刻意保留 cart（跨會話保留），與前台 navbar 一致
        window.location.href = "index.html";
    }
});

// ===== 商品管理 =====
function loadProducts() {
    $("#tableLoading").show(); $("#tableWrap").hide();
    $.ajax({
        url: "/admin/products/all", // ⭐ 後台用專屬 API，含停售商品
        method: "GET",
        headers: authHeader(),
        success: function (data) {
            allProducts = data;
            renderTable(data); updateStats(data);
            $("#tableLoading").hide(); $("#tableWrap").show();
        },
        error: function () {
            $("#tableLoading").html('<div class="text-danger py-4 text-center">❌ 載入失敗</div>');
        }
    });
}

function updateStats(data) {
    $("#statTotal").text(data.filter(p => p.active).length);
    $("#statTech").text(data.filter(p => p.type === "tech" && p.active).length);
    $("#statBusiness").text(data.filter(p => p.type === "business" && p.active).length);
    $("#statMind").text(data.filter(p => p.type === "mind" && p.active).length);
}

function renderTable(list) {
    const typeMap = {
        tech:     '<span class="badge-type bg-primary bg-opacity-10 text-primary">💻 技術</span>',
        business: '<span class="badge-type bg-success bg-opacity-10 text-success">💼 商業</span>',
        mind:     '<span class="badge-type bg-warning bg-opacity-10 text-warning">🧠 心理</span>'
    };
    $("#product-table").empty();
    if (list.length === 0) {
        $("#product-table").append('<tr><td colspan="7" class="text-center text-muted py-4">尚無商品</td></tr>');
        return;
    }
    list.forEach(p => {
        let img = p.imageUrl
            ? `<img src="${p.imageUrl}" style="width:40px;height:52px;object-fit:cover;border-radius:4px">`
            : `<div style="width:40px;height:52px;background:#f0e8d8;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px">📚</div>`;

        // ⭐ 上架狀態標籤
        let statusBadge = p.active
            ? `<span style="background:rgba(56,161,105,0.12);color:#276749;padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:600">✓ 上架中</span>`
            : `<span style="background:rgba(224,82,82,0.1);color:#c53030;padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:600">✕ 已停售</span>`;

        // ⭐ 停售/上架按鈕
        let toggleBtn = p.active
            ? `<button class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="toggleProduct(${p.id})">停售</button>`
            : `<button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="toggleProduct(${p.id})">上架</button>`;

        // ⭐ 庫存顯示
        const stock = p.stock != null ? p.stock : 0;
        let stockBadge;
        if (stock === 0) {
            stockBadge = `<span style="color:#c53030;font-weight:700">⚠ 缺貨</span>`;
        } else if (stock < 10) {
            stockBadge = `<span style="color:#c9a84c;font-weight:700">${stock} 本</span>`;
        } else {
            stockBadge = `<span style="color:#276749;font-weight:600">${stock} 本</span>`;
        }

        let row = `
        <tr style="${p.active ? '' : 'opacity:0.55'}">
            <td class="px-4 text-muted">#${p.id}</td>
            <td>${img}</td>
            <td class="fw-bold">${p.title}</td>
            <td class="text-muted">${p.author}</td>
            <td>${typeMap[p.type] || p.type}</td>
            <td class="text-danger fw-bold">NT$ ${p.price.toLocaleString()}</td>
            <td>${stockBadge}</td>
            <td>${statusBadge}</td>
            <td class="text-center" style="white-space:nowrap">
                <button class="btn btn-sm btn-outline-primary rounded-pill me-1 px-3"
                    onclick="openEditModal(${p.id})">編輯</button>
                ${toggleBtn}
                <button class="btn btn-sm btn-outline-danger rounded-pill px-2 ms-1"
                    onclick="openDeleteModal(${p.id}, '${p.title.replace(/'/g, "\\'")}')">刪除</button>
            </td>
        </tr>`;
        $("#product-table").append(row);
    });
}

function openAddModal() {
    $("#modalTitle").text("新增商品");
    $("#editId, #editTitle, #editAuthor, #editPrice, #editImageUrl, #editDescription").val("");
    $("#editStock").val(0);
    $("#editType").val("tech");
    showModal("productModal");
}

function openEditModal(id) {
    let p = allProducts.find(p => p.id == id);
    if (!p) return;
    $("#modalTitle").text("編輯商品");
    $("#editId").val(p.id);
    $("#editTitle").val(p.title);
    $("#editAuthor").val(p.author);
    $("#editPrice").val(p.price);
    $("#editType").val(p.type);
    $("#editImageUrl").val(p.imageUrl || "");
    $("#editStock").val(p.stock != null ? p.stock : 0);
    $("#editDescription").val(p.description || "");  // ⭐ 帶入既有描述
    showModal("productModal");
}

function saveProduct() {
    let title       = $("#editTitle").val().trim();
    let author      = $("#editAuthor").val().trim();
    let price       = parseInt($("#editPrice").val());
    let stock       = parseInt($("#editStock").val()) || 0;
    let type        = $("#editType").val();
    let imageUrl    = $("#editImageUrl").val().trim() || null;
    let description = $("#editDescription").val().trim() || null;  // ⭐ 描述
    let id          = $("#editId").val();

    if (!title || !author || !price || price < 1) {
        alert("❌ 請填寫完整商品資訊"); return;
    }
    if (stock < 0) { alert("❌ 庫存不能小於 0"); return; }

    let $btn = $("#saveBtn");
    $btn.addClass("btn-loading").html('<span class="spinner-border spinner-border-sm me-2"></span>儲存中...');

    $.ajax({
        url: id ? `/admin/products/${id}` : "/admin/products",
        method: id ? "PUT" : "POST",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ title, author, price, type, imageUrl, stock, description }),
        success: function () {
            hideModal("productModal"); loadProducts();
        },
        error: function (err) {
            if (err.status === 401) { alert("⚠️ 登入已過期"); window.location.href = "login.html"; }
            else alert("❌ 儲存失敗");
        },
        complete: function () { $btn.removeClass("btn-loading").html("儲存"); }
    });
}

// ⭐ 切換上架 / 停售
function toggleProduct(id) {
    let p = allProducts.find(p => p.id == id);
    if (!p) return;
    let action = p.active ? "停售" : "上架";
    if (!confirm(`確定要將「${p.title}」設為${action}嗎？`)) return;

    $.ajax({
        url: `/admin/products/${id}/toggle`,
        method: "PUT",
        headers: authHeader(),
        success: function () {
            showToast(`已${action}：${p.title}`, p.active ? "warn" : "success");
            loadProducts();
        },
        error: function (xhr) { handleApiError(xhr, `${action}失敗`); }
    });
}

function openDeleteModal(id, title) {
    deleteTargetId = id;
    $("#deleteTitle").text(title);
    showModal("deleteModal");
}

function confirmDelete() {
    if (!deleteTargetId) return;
    let $btn = $("#confirmDeleteBtn");
    $btn.addClass("btn-loading").html('<span class="spinner-border spinner-border-sm me-2"></span>刪除中...');
    $.ajax({
        url: `/admin/products/${deleteTargetId}`, method: "DELETE",
        headers: authHeader(),
        success: function () { hideModal("deleteModal"); deleteTargetId = null; loadProducts(); },
        error: function (err) {
            if (err.status === 401) { alert("⚠️ 登入已過期"); window.location.href = "login.html"; }
            else alert("❌ 刪除失敗");
        },
        complete: function () { $btn.removeClass("btn-loading").html("刪除"); }
    });
}

// ===== 訂單管理 =====
function loadOrders() {
    $("#orderTableLoading").show(); $("#orderTableWrap").hide();
    $.ajax({
        url: "/admin/orders", method: "GET",
        headers: authHeader(),
        success: function (data) {
            allOrders = data;
            renderOrders(data);
            $("#orderTableLoading").hide(); $("#orderTableWrap").show();
        },
        error: function (xhr) {
            if (xhr.status === 401) { alert("⚠️ 登入已過期"); window.location.href = "login.html"; }
            else $("#orderTableLoading").html('<div class="text-danger py-4 text-center">❌ 載入失敗</div>');
        }
    });
}

function renderOrders(list) {
    const statusMap = {
        pending:    { label: "待付款",  color: "#a07828", bg: "rgba(201,168,76,0.12)" },
        processing: { label: "待取貨",  color: "#6b46c1", bg: "rgba(159,122,234,0.12)" },
        paid:       { label: "已付款",  color: "#276749", bg: "rgba(56,161,105,0.12)" },
        shipped:    { label: "已出貨",  color: "#2b6cb0", bg: "rgba(66,153,225,0.12)" },
        completed:  { label: "已完成",  color: "#2b6cb0", bg: "rgba(66,153,225,0.12)" },
        cancelled:  { label: "已取消",  color: "#718096", bg: "rgba(113,128,150,0.12)" },
    };

    $("#order-table").empty();
    if (list.length === 0) {
        $("#order-table").append('<tr><td colspan="6" class="text-center text-muted py-4">尚無訂單</td></tr>');
        return;
    }
    list.forEach(o => {
        const s = statusMap[o.status] || { label: o.status, color: "#718096", bg: "#eee" };
        const badge = `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:50px;font-size:0.78rem;font-weight:600">${s.label}</span>`;
        const items = (o.items || []).map(i => `${i.title}×${i.qty}`).join("、") || "-";
        const row = `
        <tr>
            <td class="text-muted" style="font-family:monospace">#${o.id}</td>
            <td><div style="font-weight:600">${o.name}</div><div style="font-size:0.78rem;color:#9090a8">${o.address}</div></td>
            <td style="font-size:0.82rem;color:#666;max-width:180px">${items}</td>
            <td style="font-weight:700;color:#e05252">NT$ ${o.total.toLocaleString()}</td>
            <td>${badge}</td>
            <td>
                <select class="form-select" style="font-size:0.82rem;padding:4px 8px;border-radius:8px;width:110px"
                    onchange="updateOrderStatus(${o.id}, this.value)">
                    <option value="pending"    ${o.status==="pending"    ? "selected":""}>待付款</option>
                    <option value="processing" ${o.status==="processing" ? "selected":""}>待取貨</option>
                    <option value="paid"       ${o.status==="paid"       ? "selected":""}>已付款</option>
                    <option value="shipped"    ${o.status==="shipped"    ? "selected":""}>已出貨</option>
                    <option value="completed"  ${o.status==="completed"  ? "selected":""}>已完成</option>
                    <option value="cancelled"  ${o.status==="cancelled"  ? "selected":""}>已取消</option>
                </select>
            </td>
        </tr>`;
        $("#order-table").append(row);
    });
}

function updateOrderStatus(orderId, newStatus) {
    $.ajax({
        url: `/admin/orders/${orderId}/status`,
        method: "PUT",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ status: newStatus }),
        success: function () { showToast("狀態已更新", "success"); },
        error: function (xhr) { handleApiError(xhr, "更新失敗"); loadOrders(); }
    });
}

// ===== Modal 工具 =====
function showModal(id) {
    let el = document.getElementById(id);
    if (typeof bootstrap !== "undefined") new bootstrap.Modal(el).show();
    else $(el).modal("show");
}
function hideModal(id) {
    let el = document.getElementById(id);
    if (typeof bootstrap !== "undefined") {
        let inst = bootstrap.Modal.getInstance(el);
        if (inst) inst.hide();
    } else $(el).modal("hide");
}

// ===== Banner 管理 =====
function loadBanners() {
    $("#bannerLoading").show(); $("#bannerWrap").hide();
    $.ajax({
        url: "/admin/banners", method: "GET", headers: authHeader(),
        success: function (data) {
            $("#banner-table").empty();
            if (data.length === 0) {
                $("#banner-table").append('<tr><td colspan="6" class="text-center text-muted py-4">尚無 Banner</td></tr>');
            } else {
                data.forEach(b => {
                    const statusBadge = b.active
                        ? `<span style="background:rgba(56,161,105,0.12);color:#276749;padding:3px 10px;border-radius:50px;font-size:0.78rem;font-weight:600">✓ 上架中</span>`
                        : `<span style="background:rgba(224,82,82,0.1);color:#c53030;padding:3px 10px;border-radius:50px;font-size:0.78rem;font-weight:600">✕ 已下架</span>`;
                    const toggleLabel = b.active ? "下架" : "上架";
                    $("#banner-table").append(`
                    <tr style="${b.active ? '' : 'opacity:0.5'}">
                        <td class="text-muted" style="padding-left:24px">#${b.id}</td>
                        <td style="padding:12px 16px">
                            <img src="${b.imageUrl}" style="width:160px;height:90px;object-fit:cover;object-position:center;border-radius:6px;display:block;background:#f0f0f0">
                        </td>
                        <td class="fw-bold">${b.title || '-'}</td>
                        <td class="text-muted" style="font-size:0.85rem">${b.subtitle || '-'}</td>
                        <td class="text-center">${statusBadge}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-secondary rounded-pill me-1 px-3"
                                onclick="toggleBanner(${b.id})">${toggleLabel}</button>
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-3"
                                onclick="deleteBanner(${b.id})">刪除</button>
                        </td>
                    </tr>`);
                });
            }
            $("#bannerLoading").hide(); $("#bannerWrap").show();
        },
        error: function (xhr) { handleApiError(xhr, "載入失敗"); }
    });
}

function openAddBannerModal() {
    $("#bannerImageUrl, #bannerTitle, #bannerSubtitle").val("");
    showModal("bannerModal");
}

function saveBanner() {
    const imageUrl = $("#bannerImageUrl").val().trim();
    const title    = $("#bannerTitle").val().trim();
    const subtitle = $("#bannerSubtitle").val().trim();
    if (!imageUrl) { alert("請輸入圖片網址"); return; }

    $.ajax({
        url: "/admin/banners", method: "POST",
        contentType: "application/json", headers: authHeader(),
        data: JSON.stringify({ imageUrl, title, subtitle }),
        success: function () {
            hideModal("bannerModal");
            showToast("Banner 已新增", "success");
            loadBanners();
        },
        error: function (xhr) { handleApiError(xhr, "新增失敗"); }
    });
}

function toggleBanner(id) {
    $.ajax({
        url: `/admin/banners/${id}/toggle`, method: "PUT", headers: authHeader(),
        success: function () { showToast("狀態已更新", "info"); loadBanners(); },
        error: function (xhr) { handleApiError(xhr, "操作失敗"); }
    });
}

function deleteBanner(id) {
    if (!confirm("確定要刪除這個 Banner 嗎？")) return;
    $.ajax({
        url: `/admin/banners/${id}`, method: "DELETE", headers: authHeader(),
        success: function () { showToast("已刪除", "info"); loadBanners(); },
        error: function (xhr) { handleApiError(xhr, "刪除失敗"); }
    });
}

// ============================================================
// ⭐ Dashboard 儀表板
// ============================================================
function loadDashboard() {
    $.ajax({
        url: "/admin/dashboard/summary",
        method: "GET",
        headers: authHeader(),
        success: function (data) {
            // 統計卡片
            $("#dashTotalProducts").text(data.totalProducts);
            $("#dashActiveProducts").text(data.activeProducts);
            $("#dashTotalOrders").text(data.totalOrders);
            $("#dashTotalUsers").text(data.totalUsers);
            $("#dashTotalRevenue").text("NT$ " + (data.totalRevenue || 0).toLocaleString());
            $("#dashPendingCount").text(data.pendingCount);
            $("#dashOutOfStock").text(data.outOfStock || 0);
            $("#dashLowStock").text(data.lowStock || 0);

            // ⭐ sidebar 顯示待處理留言數
            const pm = data.pendingMessages || 0;
            if (pm > 0) {
                $("#pendingMsgBadge").text(pm).show();
            } else {
                $("#pendingMsgBadge").hide();
            }

            // 渲染圖表
            renderStatusChart(data.statusCount);

            // 銷售排行
            renderTopSelling(data.topSelling);

            // 最近訂單
            renderRecentOrders(data.recentOrders);
        },
        error: function (xhr) { handleApiError(xhr, "儀表板載入失敗"); }
    });
}

function renderStatusChart(statusCount) {
    const labelMap = {
        pending:    "待付款",
        processing: "待取貨",
        paid:       "已付款",
        shipped:    "已出貨",
        completed:  "已完成",
        cancelled:  "已取消"
    };
    const colorMap = {
        pending:    "#c9a84c",
        processing: "#9b59b6",
        paid:       "#38a169",
        shipped:    "#4a90d9",
        completed:  "#2b6cb0",
        cancelled:  "#888"
    };

    const labels = [];
    const values = [];
    const colors = [];
    Object.keys(statusCount).forEach(key => {
        labels.push(labelMap[key] || key);
        values.push(statusCount[key]);
        colors.push(colorMap[key] || "#666");
    });

    // 銷毀舊圖表
    if (statusChart) { statusChart.destroy(); }

    const ctx = document.getElementById("statusChart");
    if (!ctx || typeof Chart === "undefined") return;

    statusChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: "#fff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                    labels: { font: { size: 12 }, padding: 12 }
                }
            }
        }
    });
}

function renderTopSelling(list) {
    const $tbody = $("#topSellingTable tbody");
    $tbody.empty();
    if (!list || list.length === 0) {
        $tbody.append('<tr><td class="text-center text-muted py-4">尚無銷售資料</td></tr>');
        return;
    }
    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
    list.forEach(item => {
        const badge = medals[item.rank] || `<span style="color:#999">#${item.rank}</span>`;
        $tbody.append(`
        <tr>
            <td class="px-3" style="width:50px;font-size:1.3rem">${badge}</td>
            <td>
                <div style="font-weight:600">${item.title}</div>
                <div style="font-size:0.78rem;color:#999">銷售 ${item.totalQty} 本</div>
            </td>
            <td style="text-align:right;padding-right:20px;color:#e05252;font-weight:700">
                NT$ ${item.totalRevenue.toLocaleString()}
            </td>
        </tr>`);
    });
}

function renderRecentOrders(orders) {
    const $tbody = $("#recentOrders-table");
    $tbody.empty();
    if (!orders || orders.length === 0) {
        $tbody.append('<tr><td colspan="5" class="text-center text-muted py-4">尚無訂單</td></tr>');
        return;
    }
    const statusMap = {
        pending:    { label: "待付款", color: "#a07828", bg: "rgba(201,168,76,0.12)" },
        processing: { label: "待取貨", color: "#6b46c1", bg: "rgba(159,122,234,0.12)" },
        paid:       { label: "已付款", color: "#276749", bg: "rgba(56,161,105,0.12)" },
        shipped:    { label: "已出貨", color: "#2b6cb0", bg: "rgba(66,153,225,0.12)" },
        completed:  { label: "已完成", color: "#2b6cb0", bg: "rgba(66,153,225,0.12)" },
        cancelled:  { label: "已取消", color: "#718096", bg: "rgba(113,128,150,0.12)" },
    };
    orders.forEach(o => {
        const s = statusMap[o.status] || { label: o.status, color: "#666", bg: "#eee" };
        const badge = `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:50px;font-size:0.78rem;font-weight:600">${s.label}</span>`;
        let timeStr = "-";
        if (o.createdAt) {
            const d = new Date(o.createdAt);
            timeStr = d.toLocaleDateString("zh-TW") + " " + d.toLocaleTimeString("zh-TW", {hour:"2-digit", minute:"2-digit"});
        }
        $tbody.append(`
        <tr>
            <td class="px-4 text-muted" style="font-family:monospace">#${o.id}</td>
            <td style="font-weight:600">${o.name}</td>
            <td style="color:#e05252;font-weight:700">NT$ ${o.total.toLocaleString()}</td>
            <td>${badge}</td>
            <td style="font-size:0.85rem;color:#666">${timeStr}</td>
        </tr>`);
    });
}

// ============================================================
// ⭐ 客服留言管理
// ============================================================
let allMessages = [];
let currentReplyId = null;

function loadMessages() {
    $("#msgLoading").show(); $("#msgWrap").hide();
    $.ajax({
        url: "/admin/messages", method: "GET", headers: authHeader(),
        success: function (list) {
            allMessages = list;
            renderMessages();
            $("#msgLoading").hide(); $("#msgWrap").show();
        },
        error: function (xhr) { handleApiError(xhr, "留言載入失敗"); }
    });
}

function renderMessages() {
    const filter = $("#msgFilter").val();
    const list = filter === "all" ? allMessages : allMessages.filter(m => m.status === filter);

    const $wrap = $("#msgList");
    $wrap.empty();

    if (list.length === 0) {
        $wrap.html('<div class="text-center text-muted py-5">沒有符合條件的留言</div>');
        return;
    }

    const subjectMap = {
        order:   "📦 訂單相關",
        product: "📚 商品問題",
        refund:  "💰 退款／退貨",
        account: "👤 帳號問題",
        other:   "💬 其他諮詢"
    };
    const statusMap = {
        pending: { label: "🕒 待處理", color: "#a07828", bg: "rgba(201,168,76,0.12)" },
        replied: { label: "✓ 已回覆", color: "#276749", bg: "rgba(56,161,105,0.12)" },
        closed:  { label: "已結案",   color: "#718096", bg: "rgba(113,128,150,0.12)" }
    };

    list.forEach(m => {
        const s = statusMap[m.status] || statusMap.pending;
        const date = m.createdAt ? new Date(m.createdAt).toLocaleString("zh-TW") : "-";
        const repliedDate = m.repliedAt ? new Date(m.repliedAt).toLocaleString("zh-TW") : "";

        const replyHtml = m.reply ? `
            <div style="background:#f0f7f4;border-left:3px solid #38a169;border-radius:8px;padding:12px 16px;margin-top:12px">
                <div style="font-size:0.78rem;color:#276749;font-weight:700;margin-bottom:4px">📨 客服回覆 · ${repliedDate}</div>
                <div style="font-size:0.9rem;line-height:1.7;white-space:pre-wrap">${m.reply}</div>
            </div>` : "";

        const actionBtns = m.status === "pending"
            ? `<button class="btn btn-sm btn-primary rounded-pill px-3 me-1" onclick="openReplyModal(${m.id})">📨 回覆</button>
               <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 me-1" onclick="updateMsgStatus(${m.id}, 'closed')">關閉</button>`
            : m.status === "replied"
            ? `<button class="btn btn-sm btn-outline-primary rounded-pill px-3 me-1" onclick="openReplyModal(${m.id})">修改回覆</button>
               <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 me-1" onclick="updateMsgStatus(${m.id}, 'closed')">標為結案</button>`
            : `<button class="btn btn-sm btn-outline-warning rounded-pill px-3 me-1" onclick="updateMsgStatus(${m.id}, 'pending')">重新開啟</button>`;

        $wrap.append(`
        <div style="border-bottom:1px solid #eee;padding:20px 24px">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap">
                <div style="flex:1;min-width:0">
                    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
                        <span style="font-weight:700;font-size:1rem">${m.name}</span>
                        <span style="background:${s.bg};color:${s.color};padding:3px 12px;border-radius:50px;font-size:0.75rem;font-weight:600">${s.label}</span>
                        <span style="background:#f4f6fb;color:#666;padding:3px 10px;border-radius:50px;font-size:0.75rem">${subjectMap[m.subject] || m.subject}</span>
                        ${m.username ? `<span style="font-size:0.75rem;color:#999">會員: ${m.username}</span>` : '<span style="font-size:0.75rem;color:#999">訪客</span>'}
                    </div>
                    <div style="font-size:0.82rem;color:#666;margin-bottom:8px">
                        📧 ${m.email} ${m.phone ? ' · ☎️ ' + m.phone : ''} · 🕐 ${date}
                    </div>
                    <div style="background:#faf8f2;border-radius:8px;padding:12px 16px;font-size:0.9rem;line-height:1.7;white-space:pre-wrap">${m.content}</div>
                    ${replyHtml}
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
                    ${actionBtns}
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deleteMessage(${m.id})">🗑️ 刪除</button>
                </div>
            </div>
        </div>`);
    });
}

function openReplyModal(id) {
    const m = allMessages.find(x => x.id === id);
    if (!m) return;
    currentReplyId = id;

    $("#replyContext").html(`
        <div style="font-weight:700;margin-bottom:6px">${m.name} <span style="font-size:0.8rem;color:#666;font-weight:normal">＜${m.email}＞</span></div>
        <div style="font-size:0.85rem;color:#666;margin-bottom:8px">主題：${({order:"訂單相關",product:"商品問題",refund:"退款／退貨",account:"帳號問題",other:"其他諮詢"})[m.subject] || m.subject}</div>
        <div style="font-size:0.88rem;background:white;border-radius:6px;padding:10px;white-space:pre-wrap">${m.content}</div>
    `);
    $("#replyContent").val(m.reply || "");
    showModal("replyModal");
}

function submitReply() {
    const reply = $("#replyContent").val().trim();
    if (!reply) { alert("請輸入回覆內容"); return; }

    $.ajax({
        url: `/admin/messages/${currentReplyId}/reply`,
        method: "PUT",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ reply: reply }),
        success: function () {
            hideModal("replyModal");
            showToast("✅ 回覆已送出", "success");
            loadMessages();
            loadDashboard(); // 更新 sidebar badge
        },
        error: function (xhr) { handleApiError(xhr, "回覆失敗"); }
    });
}

function updateMsgStatus(id, status) {
    $.ajax({
        url: `/admin/messages/${id}/status`,
        method: "PUT",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ status }),
        success: function () { showToast("狀態已更新", "info"); loadMessages(); loadDashboard(); },
        error: function (xhr) { handleApiError(xhr, "更新失敗"); }
    });
}

function deleteMessage(id) {
    if (!confirm("確定要刪除這筆留言嗎？")) return;
    $.ajax({
        url: `/admin/messages/${id}`,
        method: "DELETE",
        headers: authHeader(),
        success: function () { showToast("已刪除", "info"); loadMessages(); loadDashboard(); },
        error: function (xhr) { handleApiError(xhr, "刪除失敗"); }
    });
}
