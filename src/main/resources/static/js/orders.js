$(document).ready(function () {

    if (!localStorage.getItem("username")) {
        window.location.href = "login.html";
        return;
    }

    function statusLabel(status) {
        const map = {
            "pending":   '<span class="badge badge-gold">待付款</span>',
            "paid":      '<span class="badge badge-green">已付款</span>',
            "shipped":   '<span class="badge badge-blue">已出貨</span>',
            "completed": '<span class="badge badge-blue">已完成</span>',
            "cancelled": '<span class="badge badge-gray">已取消</span>'
        };
        return map[status] || `<span class="badge badge-gray">${status}</span>`;
    }

    $.ajax({
        url: "/my-orders",
        method: "GET",
        headers: authHeader(),
        success: function (orders) {
            $("#order-list").empty();

            if (orders.length === 0) {
                $("#order-list").append(`
                    <tr><td colspan="5">
                        <div style="text-align:center;padding:48px;color:var(--text-muted)">
                            <div style="font-size:2.5rem;opacity:0.3;margin-bottom:12px">📋</div>
                            <div>尚無訂單紀錄</div>
                        </div>
                    </td></tr>
                `);
                return;
            }

            orders.forEach(order => {
                // ⭐ 整理書名明細
                let itemsHtml = "";
                if (order.items && order.items.length > 0) {
                    itemsHtml = order.items.map(i =>
                        `<span style="display:inline-block;background:var(--cream-2);border-radius:4px;padding:2px 8px;font-size:0.75rem;margin:2px">${i.title} ×${i.qty}</span>`
                    ).join("");
                }

                // ⭐ 待付款訂單顯示「繼續付款」按鈕
                let payBtn = "";
                if (order.status === "pending") {
                    payBtn = `<button class="btn btn-gold btn-sm" style="margin-top:6px;font-size:0.78rem"
                        onclick="continuePay(${order.id}, ${order.total})">繼續付款</button>`;
                }

                $("#order-list").append(`
                    <tr>
                        <td><span class="order-id">#${order.id}</span></td>
                        <td>
                            <div style="font-weight:600">${order.name}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${order.address}</div>
                            ${itemsHtml ? `<div style="margin-top:6px">${itemsHtml}</div>` : ""}
                            ${payBtn}
                        </td>
                        <td style="text-align:right;font-weight:700;color:var(--red)">NT$ ${order.total.toLocaleString()}</td>
                        <td style="text-align:center">${statusLabel(order.status)}</td>
                    </tr>
                `);
            });
        },
        error: function (xhr) {
            handleApiError(xhr, "讀取訂單失敗");
        }
    });
});

// ⭐ 繼續付款：把訂單資訊存回 localStorage 再跳付款頁
function continuePay(orderId, total) {
    localStorage.setItem("orderId", orderId);
    localStorage.setItem("total", total);
    window.location.href = "payment.html";
}
