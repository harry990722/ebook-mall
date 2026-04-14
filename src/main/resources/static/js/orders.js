$(document).ready(function () {

    let username = localStorage.getItem("username");

    if (!username) {
        alert("請先登入！");
        window.location.href = "login.html";
        return;
    }

    $.ajax({
        url: "/my-orders?username=" + username,
        method: "GET",

        success: function (orders) {

            $("#order-list").empty();

            orders.forEach(order => {

                // ⭐ 加入這段：遍歷每一筆訂單裡的商品項目
                if (order.items) {
                    order.items.forEach(item => {
                        console.log("訂單編號 " + order.id + " 的商品：" + item.title);
                    });
                }

                let html = `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.name}</td>
                        <td>${order.address}</td>
                        <td>NT$ ${order.total}</td>
                        <td>${order.status}</td>
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
