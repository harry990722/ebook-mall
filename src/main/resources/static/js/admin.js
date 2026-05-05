let allProducts = [];
let deleteTargetId = null;

$(document).ready(function () {

    // ===== 登入 & 權限檢查 =====
    let username = localStorage.getItem("username");
    let role     = localStorage.getItem("role");

    if (!username || !localStorage.getItem("token")) {
        alert("請先登入！");
        window.location.href = "login.html";
        return;
    }

    if (role !== "admin") {
        alert("⛔ 您沒有權限進入後台管理！");
        window.location.href = "index.html";
        return;
    }
    $("#adminUser").text(username);

    loadProducts();

    // 登出
    $("#adminLogout").click(function () {
        if (confirm("確定要登出嗎？")) {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            localStorage.removeItem("login");
            window.location.href = "index.html";
        }
    });
});

// ===== 載入商品列表 =====
function loadProducts() {
    $("#tableLoading").show();
    $("#tableWrap").hide();

    $.ajax({
        url: "/products",
        method: "GET",
        success: function (data) {
            allProducts = data;
            renderTable(data);
            updateStats(data);
            $("#tableLoading").hide();
            $("#tableWrap").show();
        },
        error: function () {
            $("#tableLoading").html('<div class="text-danger py-4 text-center">❌ 載入失敗，請確認後端是否啟動</div>');
        }
    });
}

// ===== 統計卡片 =====
function updateStats(data) {
    $("#statTotal").text(data.length);
    $("#statTech").text(data.filter(p => p.type === "tech").length);
    $("#statBusiness").text(data.filter(p => p.type === "business").length);
    $("#statMind").text(data.filter(p => p.type === "mind").length);
}

// ===== 渲染表格 =====
function renderTable(list) {
    const typeMap = {
        tech:     '<span class="badge-type bg-primary bg-opacity-10 text-primary">💻 技術</span>',
        business: '<span class="badge-type bg-success bg-opacity-10 text-success">💼 商業</span>',
        mind:     '<span class="badge-type bg-warning bg-opacity-10 text-warning">🧠 心理</span>'
    };

    $("#product-table").empty();

    if (list.length === 0) {
        $("#product-table").append('<tr><td colspan="6" class="text-center text-muted py-4">尚無商品資料</td></tr>');
        return;
    }

    list.forEach(p => {
        let typeLabel = typeMap[p.type] || `<span class="badge bg-secondary">${p.type}</span>`;
        let row = `
        <tr>
            <td class="px-4 text-muted">#${p.id}</td>
            <td class="fw-bold">${p.title}</td>
            <td class="text-muted">${p.author}</td>
            <td>${typeLabel}</td>
            <td class="text-danger fw-bold">NT$ ${p.price}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary rounded-pill me-1 px-3"
                    onclick="openEditModal(${p.id})">編輯</button>
                <button class="btn btn-sm btn-outline-danger rounded-pill px-3"
                    onclick="openDeleteModal(${p.id}, '${p.title.replace(/'/g, "\\'")}')">刪除</button>
            </td>
        </tr>`;
        $("#product-table").append(row);
    });
}

// ===== Modal 開關輔助 =====
function showModal(id) {
    // 優先用 bootstrap 物件，若不存在改用 jQuery 觸發
    let el = document.getElementById(id);
    if (typeof bootstrap !== "undefined") {
        new bootstrap.Modal(el).show();
    } else {
        $(el).modal("show");
    }
}

function hideModal(id) {
    let el = document.getElementById(id);
    if (typeof bootstrap !== "undefined") {
        let instance = bootstrap.Modal.getInstance(el);
        if (instance) instance.hide();
    } else {
        $(el).modal("hide");
    }
}

// ===== 新增 Modal =====
function openAddModal() {
    $("#modalTitle").text("新增商品");
    $("#editId").val("");
    $("#editTitle, #editAuthor, #editPrice").val("");
    $("#editType").val("tech");
    showModal("productModal");
}

// ===== 編輯 Modal =====
function openEditModal(id) {
    let p = allProducts.find(p => p.id == id);
    if (!p) return;

    $("#modalTitle").text("編輯商品");
    $("#editId").val(p.id);
    $("#editTitle").val(p.title);
    $("#editAuthor").val(p.author);
    $("#editPrice").val(p.price);
    $("#editType").val(p.type);
    showModal("productModal");
}

// ===== 儲存（新增或編輯）=====
function saveProduct() {
    let title  = $("#editTitle").val().trim();
    let author = $("#editAuthor").val().trim();
    let price  = parseInt($("#editPrice").val());
    let type   = $("#editType").val();
    let id     = $("#editId").val();

    if (!title || !author || !price || price < 1) {
        alert("❌ 請填寫完整商品資訊");
        return;
    }

    let productData = { title, author, price, type };

    // ⭐ Loading 狀態
    let $btn = $("#saveBtn");
    $btn.addClass("btn-loading").html('<span class="spinner-border spinner-border-sm me-2"></span>儲存中...');

    let isEdit = id !== "";
    let url    = isEdit ? `/admin/products/${id}` : "/admin/products";
    let method = isEdit ? "PUT" : "POST";

    $.ajax({
        url, method,
        contentType: "application/json",
        headers: authHeader(),
        data: JSON.stringify(productData),
        success: function () {
            hideModal("productModal");
            loadProducts();
        },
        error: function (err) {
            if (err.status === 401) {
                alert("⚠️ 登入已過期，請重新登入");
                window.location.href = "login.html";
            } else {
                alert("❌ 儲存失敗，請再試一次");
            }
        },
        complete: function () {
            $btn.removeClass("btn-loading").html("儲存");
        }
    });
}

// ===== 刪除確認 Modal =====
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
        url: `/admin/products/${deleteTargetId}`,
        method: "DELETE",
        headers: authHeader(),
        success: function () {
            hideModal("deleteModal");
            deleteTargetId = null;
            loadProducts();
        },
        error: function (err) {
            if (err.status === 401) {
                alert("⚠️ 登入已過期，請重新登入");
                window.location.href = "login.html";
            } else {
                alert("❌ 刪除失敗");
            }
        },
        complete: function () {
            $btn.removeClass("btn-loading").html("刪除");
        }
    });
}
