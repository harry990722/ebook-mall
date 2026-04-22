// ⭐ 圖片邏輯（跟首頁一致）
function getBookImage(title) {
    if (!title) {
        return "https://unsplash.com";
    }
    if (title.includes("Java")) {
        return "https://unsplash.com";
    }
    if (title.includes("Spring")) {
        return "https://unsplash.com";
    }
    if (title.includes("前端")) {
        return "https://unsplash.com";
    }
    // 預設圖片
    return "https://unsplash.com";
}

$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    let currentProduct = null;

    // ⭐ 載入商品
    if (id) {
        $.ajax({
            url: "/products/" + id,
            method: "GET",
            success: function (product) {

                currentProduct = product;

                $("#title").text(product.title);
                $("#author").text(product.author);
                $("#price").text("NT$ " + product.price);
                $("#oldPrice").text("NT$ " + Math.round(product.price * 1.2));

                // ⭐ 設定圖片（含防破圖）
                let imgUrl = getBookImage(product.title);

                $("#productImage")
                    .attr("src", imgUrl)
                    .on("error", function () {
                        $(this).attr("src", "https://unsplash.com");
                    });

                loadRecommendations(id);
            },
            error: function () {
                alert("商品載入失敗");
            }
        });
    }

    // ⭐ 推薦商品
    function loadRecommendations(currentId) {

        $.get("/products", function (allProducts) {

            const recomDiv = $("#recommendations");
            recomDiv.empty();

            const others = allProducts
                .filter(p => p.id != currentId)
                .slice(0, 3);

            others.forEach(p => {

                let img = getBookImage(p.title);

                recomDiv.append(`
                    <div class="col-md-4 mb-3">
                        <div class="card recom-card p-3"
                             onclick="location.href='product.html?id=${p.id}'"
                             style="cursor:pointer">

                            <img src="${img}"
                                 style="height:120px; object-fit:cover; border-radius:5px; width:100%;"
                                 onerror="this.src='https://unsplash.com'">

                            <div class="card-body text-center">
                                <h6 class="text-truncate">${p.title}</h6>
                                <p class="text-danger fw-bold mb-0">NT$ ${p.price}</p>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    }

    // ⭐ 按鈕（購物車 / 直接購買）
    $(document).on("click", "#addCart", function () {
        handleAction("cart.html");
    });

    $(document).on("click", "#buyNow", function () {
        handleAction("checkout.html");
    });

	function handleAction(targetUrl) {
	    if (!currentProduct) {
	        alert("商品尚未載入！");
	        return;
	    }

	    // ⭐ 新增：判斷是否登入
	    let username = localStorage.getItem("username");
	    if (targetUrl === "checkout.html" && !username) {
	        alert("請先登入會員才能進行購買！");
	        window.location.href = "login.html";
	        return;
	    }

	    const qty = parseInt($("#buyQty").val()) || 1;

	    let cartItem = {
	        title: currentProduct.title,
	        price: currentProduct.price,
	        qty: qty
	    };

	    $.ajax({
	        url: "/cart",
	        method: "POST",
	        contentType: "application/json",
	        data: JSON.stringify(cartItem),
	        success: function () {
	            window.location.href = targetUrl;
	        },
	        error: function () {
	            alert("加入失敗，請檢查後端服務");
	        }
	    });
	}
}