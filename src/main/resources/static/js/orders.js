$(document).ready(function () {

    let username = localStorage.getItem("username");

    if (!username) {
        alert("請先登入！");
        window.location.href = "login.html";
        return;
    }

    // ⭐ 狀態中文對應
    function statusLabel(status) {
        const map = {
            "pending":   '<span class="badge bg-warning text-dark badge-status">待付款</span>',
            "paid":      '<span class="badge bg-success badge-status">已付款</span>',
            "shipped":   '<span class="badge bg-info text-dark badge-status">已出貨</span>',
            "completed": '<span class="badge bg-primary badge-status">已完成</span>',
            "cancelled": '<span class="badge bg-secondary badge-status">已取消</span>'
        };
        return map[status] || `<span class="badge bg-secondary badge-status">${status}</span>`;
    }

    $.ajax({
        url: "/my-orders",
        method: "GET",
        headers: authHeader(),

        success: function (orders) {

            $("#order-list").empty();

            if (orders.length === 0) {
                $("#order-list").append('<tr><td colspan="5" class="text-center text-muted py-4">尚無訂單紀錄</td></tr>');
                return;
            }

            orders.forEach(order => {
                let html = `
                    <tr>
                        <td class="px-3">${order.id}</td>
                        <td>${order.name}</td>
                        <td>${order.address}</td>
                        <td>NT$ ${order.total}</td>
                        <td class="text-center">${statusLabel(order.status)}</td>
                    </tr>
                `;
                $("#order-list").append(html);
            });

        },

        error: function () {
            alert("讀取訂單失敗！");
        }
    });

});
