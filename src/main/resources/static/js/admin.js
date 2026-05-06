let allProducts = [];
let allOrders   = [];
let deleteTargetId = null;
let currentTab = "products";

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

    loadProducts();

    // Tab 切換
    $(document).on("click", ".tab-btn", function () {
        $(".tab-btn").removeClass("active");
        $(this).addClass("active");
        currentTab = $(this).data("tab");
        if (currentTab === "products") {
            $("#products-section").show(); $("#orders-section").hide();
            loadProducts();
        } else {
            $("#products-section").hide(); $("#orders-section").show();
            loadOrders();
        }
    });

    // 登出
    $("#adminLogout").click(function () {
        if (confirm("確定要登出嗎？")) {
            localStorage.removeItem("token"); localStorage.removeItem("username");
            localStorage.removeItem("role");  localStorage.removeItem("login");
            window.location.href = "index.html";
        }
    });
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

        let row = `
        <tr style="${p.active ? '' : 'opacity:0.55'}">
            <td class="px-4 text-muted">#${p.id}</td>
            <td>${img}</td>
            <td class="fw-bold">${p.title}</td>
            <td class="text-muted">${p.author}</td>
            <td>${typeMap[p.type] || p.type}</td>
            <td class="text-danger fw-bold">NT$ ${p.price.toLocaleString()}</td>
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
    $("#editId, #editTitle, #editAuthor, #editPrice, #editImageUrl").val("");
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
    showModal("productModal");
}

function saveProduct() {
    let title    = $("#editTitle").val().trim();
    let author   = $("#editAuthor").val().trim();
    let price    = parseInt($("#editPrice").val());
    let type     = $("#editType").val();
    let imageUrl = $("#editImageUrl").val().trim() || null;
    let id       = $("#editId").val();

    if (!title || !author || !price || price < 1) {
        alert("❌ 請填寫完整商品資訊"); return;
    }

    let $btn = $("#saveBtn");
    $btn.addClass("btn-loading").html('<span class="spinner-border spinner-border-sm me-2"></span>儲存中...');

    $.ajax({
        url: id ? `/admin/products/${id}` : "/admin/products",
        method: id ? "PUT" : "POST",
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify({ title, author, price, type, imageUrl }),
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
        pending:   { label: "待付款", color: "#a07828", bg: "rgba(201,168,76,0.12)" },
        paid:      { label: "已付款", color: "#276749", bg: "rgba(56,161,105,0.12)" },
        shipped:   { label: "已出貨", color: "#2b6cb0", bg: "rgba(66,153,225,0.12)" },
        completed: { label: "已完成", color: "#2b6cb0", bg: "rgba(66,153,225,0.12)" },
        cancelled: { label: "已取消", color: "#718096", bg: "rgba(113,128,150,0.12)" },
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
                    <option value="pending"   ${o.status==="pending"   ? "selected":""}>待付款</option>
                    <option value="paid"      ${o.status==="paid"      ? "selected":""}>已付款</option>
                    <option value="shipped"   ${o.status==="shipped"   ? "selected":""}>已出貨</option>
                    <option value="completed" ${o.status==="completed" ? "selected":""}>已完成</option>
                    <option value="cancelled" ${o.status==="cancelled" ? "selected":""}>已取消</option>
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
