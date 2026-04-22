$(document).ready(function () {
    updateNavbar();
});

function updateNavbar() {
    const username = localStorage.getItem("username");
    const $navUser = $("#nav-user");

    if (!$navUser.length) return; // 沒有這個元素就跳過

    if (username) {
        $navUser.html(`
            👤 <span class="fw-bold text-primary">${username}</span>
            <button id="logoutBtn" class="btn btn-sm btn-outline-danger ms-2">登出</button>
        `);

        $("#logoutBtn").click(function () {
            if (confirm("確定要登出嗎？")) {
                localStorage.removeItem("username");
                location.reload();
            }
        });

    } else {
        $navUser.html(`
            <a class="nav-link px-3" href="login.html">登入</a>
            <a class="nav-link px-3" href="register.html">註冊</a>
        `);
    }
}