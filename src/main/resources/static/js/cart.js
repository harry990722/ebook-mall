$(document).ready(function () {

    loadCart();

});

// 讀取購物車
function loadCart() {

    $.ajax({
        url: "/cart",
        method: "GET",
        success: function (cart) {

            $("#cart-list").empty();

            let total = 0;

            cart.forEach((item, index) => {

                let subtotal = item.price * (item.qty || 1);
                total += subtotal;

                let html = `
                    <tr>
                        <td>${item.title}</td>
                        <td>${item.price}</td>
                        <td>${item.qty || 1}</td>
                        <td>${subtotal}</td>
                        <td>
                            <button onclick="removeItem(${index})">刪除</button>
                        </td>
                    </tr>
                `;

                $("#cart-list").append(html);
            });

            $("#totalPrice").text(total);
        }
    });
}

// 刪除商品
function removeItem(index) {

    $.ajax({
        url: "/cart/" + index,
        method: "DELETE",
        success: function () {
            alert("刪除成功");
            loadCart(); // 重新載入
        }
    });

}