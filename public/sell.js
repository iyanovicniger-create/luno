const $ = (sel) => document.querySelector(sel);

let currentUser = null;
let inventoryItems = [];
let sellContext = null;

let invSearchQuery = "";
let invSortMode = "default";

async function refreshMe() {
  const r = await fetch("/api/me");
  const data = await r.json();
  currentUser = data.user;
  const btnLogin = $("#btnLogin");
  const userBox = $("#userBox");
  const tradeCard = $("#tradeCard");
  const invToolbar = $("#invToolbar");
  if (currentUser) {
    btnLogin.classList.add("hidden");
    userBox.classList.remove("hidden");
    tradeCard.classList.remove("hidden");
    invToolbar.classList.remove("hidden");
    $("#avatar").src = currentUser.avatar || "";
    $("#avatar").alt = currentUser.displayName;
    $("#userName").textContent = currentUser.displayName;
    setTradeUrlStatus(
      currentUser.tradeUrlLinked
        ? "Trade URL привязан — можно выставлять предметы на витрину."
        : "Ссылка не сохранена: вставьте Trade URL из Steam, иначе кнопка «На витрину» недоступна.",
      currentUser.tradeUrlLinked ? "ok" : ""
    );
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(currentUser);
  } else {
    btnLogin.classList.remove("hidden");
    userBox.classList.add("hidden");
    tradeCard.classList.add("hidden");
    invToolbar.classList.add("hidden");
    inventoryItems = [];
    $("#invGrid").innerHTML = "";
    setInvStatus("Войдите через Steam, чтобы увидеть инвентарь CS2.", false);
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(null);
  }
}

function setTradeUrlStatus(text, kind) {
  const el = $("#tradeUrlStatus");
  el.textContent = text;
  el.classList.remove("ok", "err");
  if (kind) el.classList.add(kind);
}

$("#btnSaveTradeUrl").addEventListener("click", async () => {
  const tradeUrl = $("#tradeUrlInput").value.trim();
  if (!tradeUrl) {
    setTradeUrlStatus("Вставьте ссылку из Steam.", "err");
    return;
  }
  try {
    const r = await fetch("/api/trade-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeUrl }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Не удалось сохранить");
    $("#tradeUrlInput").value = "";
    setTradeUrlStatus("Сохранено. Ссылка с токеном на сервере хранится только для показа покупателям на витрине.", "ok");
    await refreshMe();
    if (inventoryItems.length) renderInventory();
  } catch (e) {
    setTradeUrlStatus(e.message, "err");
  }
});

$("#btnClearTradeUrl").addEventListener("click", async () => {
  try {
    const r = await fetch("/api/trade-url", { method: "DELETE" });
    if (!r.ok) throw new Error("Не удалось сбросить");
    setTradeUrlStatus("Привязка снята. Новые объявления создать нельзя, пока снова не сохраните Trade URL.", "err");
    await refreshMe();
    if (inventoryItems.length) renderInventory();
  } catch (e) {
    setTradeUrlStatus(e.message, "err");
  }
});

function setInvStatus(text, isError) {
  const el = $("#invStatus");
  el.textContent = text;
  el.style.color = isError ? "var(--danger)" : "";
}

function getFilteredSortedItems(items) {
  let list = [...items];
  const q = invSearchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter((it) => {
      const name = String(it.name || "").toLowerCase();
      const mh = String(it.market_hash_name || "").toLowerCase();
      return name.includes(q) || mh.includes(q);
    });
  }
  if (invSortMode === "name-asc") {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), "ru"));
  } else if (invSortMode === "name-desc") {
    list.sort((a, b) => String(b.name).localeCompare(String(a.name), "ru"));
  }
  return list;
}

function updateSortButtonTitle() {
  const btn = $("#btnSortPrice");
  if (!btn) return;
  if (invSortMode === "default") btn.title = "Порядок как в Steam. Нажмите — по имени A→Z";
  else if (invSortMode === "name-asc") btn.title = "Сейчас: A→Z. Нажмите — Z→A";
  else btn.title = "Сейчас: Z→A. Нажмите — сбросить";
}

async function loadInventory() {
  setInvStatus("Загрузка…");
  $("#invGrid").innerHTML = "";
  try {
    const r = await fetch("/api/inventory");
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || r.statusText);
    }
    const data = await r.json();
    inventoryItems = data.items || [];
    setInvStatus(`Предметов: ${inventoryItems.length}`);
    renderInventory();
  } catch (e) {
    setInvStatus(e.message || "Ошибка", true);
  }
}

function renderInventory() {
  const grid = $("#invGrid");
  grid.innerHTML = "";
  const canList = !!(currentUser && currentUser.tradeUrlLinked);
  const displayItems = getFilteredSortedItems(inventoryItems);

  if (!inventoryItems.length) {
    return;
  }
  if (!displayItems.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.style.cssText = "grid-column:1/-1;padding:1rem;text-align:center";
    p.textContent = "Ничего не найдено по запросу.";
    grid.appendChild(p);
    return;
  }

  for (const it of displayItems) {
    const card = document.createElement("article");
    card.className = "card";
    const tradable = it.tradable;
    const listable = tradable && canList;
    card.innerHTML = `
      ${it.icon ? `<img src="${escapeAttr(it.icon)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : "<div style='height:72px'></div>"}
      <h3 class="card-title">${escapeHtml(it.name)}</h3>
      <span class="badge ${tradable ? "tradable" : "locked"}">${tradable ? "Торгуемый" : "Не торгуемый"}</span>
      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-sell="${escapeAttr(it.assetid)}" ${listable ? "" : "disabled"} title="${
          !tradable ? "Предмет не торгуемый" : !canList ? "Сначала привяжите Steam Trade URL" : ""
        }">
          На витрину
        </button>
      </div>
    `;
    grid.appendChild(card);
  }

  grid.querySelectorAll("[data-sell]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-sell");
      const item = inventoryItems.find((x) => String(x.assetid) === id);
      if (item) openSellModal(item);
    });
  });
}

$("#invSearch").addEventListener("input", () => {
  invSearchQuery = $("#invSearch").value;
  renderInventory();
});

$("#btnSortPrice").addEventListener("click", () => {
  if (invSortMode === "default") invSortMode = "name-asc";
  else if (invSortMode === "name-asc") invSortMode = "name-desc";
  else invSortMode = "default";
  updateSortButtonTitle();
  renderInventory();
});

$("#btnRefreshInv").addEventListener("click", () => {
  if (currentUser) loadInventory();
});

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function openSellModal(item) {
  sellContext = item;
  $("#sellItemName").textContent = item.name;
  $("#formSell").querySelector("[name=price]").value = "";
  $("#formSell").querySelector("[name=note]").value = "";
  $("#modalSell").showModal();
}

$("#modalCancel").addEventListener("click", () => $("#modalSell").close());

$("#formSell").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  if (!sellContext) return;
  const fd = new FormData($("#formSell"));
  const priceRub = Number(fd.get("price"));
  const note = fd.get("note") || "";
  try {
    const r = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetid: sellContext.assetid,
        priceRub,
        note,
        itemName: sellContext.name,
        itemIcon: sellContext.icon,
        marketHashName: sellContext.market_hash_name,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Не удалось создать объявление");
    $("#modalSell").close();
    setInvStatus("Объявление на витрине — откройте раздел «Купить скины».");
  } catch (e) {
    alert(e.message);
  }
});

document.addEventListener("cs2orbitbalance", (ev) => {
  const n = ev.detail && typeof ev.detail.balanceRub === "number" ? ev.detail.balanceRub : null;
  if (currentUser && n !== null) currentUser.balanceRub = n;
});

const params = new URLSearchParams(location.search);

updateSortButtonTitle();

(async () => {
  await refreshMe();
  if (currentUser) await loadInventory();
  else if (params.get("login") === "fail") {
    setInvStatus("Вход через Steam не удался. Проверьте STEAM_API_KEY и PUBLIC_URL в .env", true);
  }
})();
