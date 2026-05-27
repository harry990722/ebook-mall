// ⭐ AI 客服小幫手 - 浮動聊天視窗
(function () {
    let chatHistory = [];
    let isOpen = false;
    let isLoading = false;

    // 注入 HTML 到 body
    function initWidget() {
        // ⭐ 在 chat.html 頁面不顯示浮動視窗（避免雙視窗）
        if (window.location.pathname.endsWith("chat.html")) return;

        const html = `
            <button id="chatFab" class="chat-fab" title="AI 客服小幫手">
                <span class="chat-fab-pulse"></span>
                💬
            </button>

            <div id="chatWindow" class="chat-window">
                <div class="chat-header">
                    <div class="chat-header-title">
                        <div class="chat-avatar">📚</div>
                        <div>
                            <div class="chat-name">小書 AI 客服</div>
                            <div class="chat-status">線上服務中</div>
                        </div>
                    </div>
                    <button class="chat-close" id="chatExpand" title="開啟完整對話" style="margin-right:4px;font-size:1.1rem">⛶</button>
                    <button class="chat-close" id="chatClose">×</button>
                </div>

                <div class="chat-body" id="chatBody">
                    <div class="chat-msg bot">
                        <div class="chat-bubble">
                            您好！我是電子書商城的 AI 客服「小書」📚<br>
                            有什麼可以幫您的嗎？您可以問我商品、訂單、付款相關問題喔！
                        </div>
                    </div>
                </div>

                <div class="chat-quick" id="chatQuick">
                    <button class="chat-quick-btn" data-msg="如何取消訂單？">如何取消訂單？</button>
                    <button class="chat-quick-btn" data-msg="付款方式有哪些？">付款方式</button>
                    <button class="chat-quick-btn" data-msg="如何成為會員？">如何成為會員</button>
                    <button class="chat-quick-btn" onclick="window.location.href='contact.html'" style="background:rgba(201,168,76,0.15);border-color:#C9A84C;color:#C9A84C">📞 真人客服</button>
                </div>

                <div class="chat-footer">
                    <input type="text" id="chatInput" class="chat-input" placeholder="輸入訊息..." maxlength="200">
                    <button id="chatSend" class="chat-send" title="送出">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper);

        bindEvents();
    }

    function bindEvents() {
        document.getElementById("chatFab").addEventListener("click", toggleChat);
        document.getElementById("chatClose").addEventListener("click", toggleChat);
        document.getElementById("chatExpand").addEventListener("click", function () {
            window.location.href = "chat.html";
        });
        document.getElementById("chatSend").addEventListener("click", sendMessage);
        document.getElementById("chatInput").addEventListener("keydown", function (e) {
            if (e.key === "Enter") sendMessage();
        });
        // 快速問題按鈕
        document.querySelectorAll(".chat-quick-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const msg = this.getAttribute("data-msg");
                document.getElementById("chatInput").value = msg;
                sendMessage();
            });
        });
    }

    function toggleChat() {
        isOpen = !isOpen;
        const win = document.getElementById("chatWindow");
        const fab = document.getElementById("chatFab");
        if (isOpen) {
            win.classList.add("open");
            fab.classList.add("hidden");
            setTimeout(() => document.getElementById("chatInput").focus(), 300);
        } else {
            win.classList.remove("open");
            fab.classList.remove("hidden");
        }
    }

    function appendMessage(role, text) {
        const body = document.getElementById("chatBody");
        const div = document.createElement("div");
        div.className = "chat-msg " + (role === "user" ? "user" : "bot");
        div.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div>`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
        const body = document.getElementById("chatBody");
        const div = document.createElement("div");
        div.className = "chat-msg bot";
        div.id = "chatTyping";
        div.innerHTML = `<div class="chat-typing"><span></span><span></span><span></span></div>`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function removeTyping() {
        const t = document.getElementById("chatTyping");
        if (t) t.remove();
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML.replace(/\n/g, "<br>");
    }

    function sendMessage() {
        if (isLoading) return;
        const input = document.getElementById("chatInput");
        const msg = input.value.trim();
        if (!msg) return;

        // 顯示使用者訊息
        appendMessage("user", msg);
        input.value = "";

        // 隱藏快速問題（首次發送後）
        const quick = document.getElementById("chatQuick");
        if (quick) quick.style.display = "none";

        // 顯示打字中
        showTyping();
        isLoading = true;
        document.getElementById("chatSend").disabled = true;

        // 送到後端
        fetch("/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: msg,
                history: chatHistory
            })
        })
        .then(res => res.json())
        .then(data => {
            removeTyping();
            const reply = data.reply || "❌ 沒有收到回應";
            appendMessage("bot", reply);

            // 加入對話歷史
            chatHistory.push({ role: "user",      content: msg });
            chatHistory.push({ role: "assistant", content: reply });
        })
        .catch(err => {
            removeTyping();
            appendMessage("bot", "😅 抱歉，連線失敗，請稍後再試");
            console.error(err);
        })
        .finally(() => {
            isLoading = false;
            document.getElementById("chatSend").disabled = false;
            document.getElementById("chatInput").focus();
        });
    }

    // DOM ready 後初始化
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initWidget);
    } else {
        initWidget();
    }
})();
