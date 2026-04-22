$(document).ready(function () {
    loadCart();
});

function loadCart() {
    $.ajax({
        url: "/cart",
        method: "GET",
        success: function (cart) {
            $("#cart-list").empty();
            let total = 0;

            if (cart.length === 0) {
                $("#cart-list").append('<tr><td colspan="5" style="text-align:center;">購物車是空的</td></tr>');
            } else {
                cart.forEach((item, index) => {
                    let subtotal = item.price * (item.qty || 1);
                    total += subtotal;

                    let html = `
                        <tr>
                            <td>${item.title}</td>
                            <td>NT$ ${item.price}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <button class="btn btn-outline-secondary btn-sm" onclick="updateQty(${index}, -1)">-</button>
                                    <span>${item.qty || 1}</span>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="updateQty(${index}, 1)">+</button>
                                </div>
                            </td>
                            <td>NT$ ${subtotal}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">刪除</button>
                            </td>
                        </tr>
                    `;
                    $("#cart-list").append(html);
                });
            }
            $("#totalPrice").text(total);
        }
    });
}

// ⭐ 更新數量函式
function updateQty(index, change) {
    $.ajax({
        url: "/cart/update/" + index + "?change=" + change,
        method: "PUT",
        success: function () {
            loadCart(); // 重新整理畫面
        }
    });
}

function removeItem(index) {
    if(!confirm("確定要刪除嗎？")) return;
    $.ajax({
        url: "/cart/" + index,
        method: "DELETE",
        success: function () {
            loadCart();
        }
    });
}
