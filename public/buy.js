const $ = (sel) => document.querySelector(sel);

let currentUser = null;
let rawListings = [];

async function refreshMe() {
  const r = await fetch("/api/me");
  const data = await r.json();
  currentUser = data.user;
  const btnLogin = $("#btnLogin");
  const userBox = $("#userBox");
  if (currentUser) {
    btnLogin.classList.add("hidden");
    userBox.classList.remove("hidden");
    $("#avatar").src = currentUser.avatar || "";
    $("#avatar").alt = currentUser.displayName;
    $("#userName").textContent = currentUser.displayName;
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(currentUser);
  } else {
    btnLogin.classList.remove("hidden");
    userBox.classList.add("hidden");
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(null);
  }
}

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

function steamEconomyThumb(iconPath) {
  return `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}/128fx64f`;
}


const BUY_CATEGORY_DROPDOWNS = [
  {
    id: "knife",
    label: "Нож",
    items: [
      { name: "Karambit", icon: "IzMF03bi9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdB2ozio1RrlIWFK3UfvMYB8UsvjiMXojflsZalyxSh31CIyHz2GZ-KuFpPsrTzBG0quOfHXn1YSOKeHCLTwlsG-BfMW7RqjX24-6XQGvOR-wlR18MLqRQ9WNBO8yMN0E43JlLpWL-lEtxEQQlZ8lSeR-30ykSN-R3zCc6mJUl-Q", needle: "Karambit" },
      { name: "Bayonet", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0POjV6BiMOCfC3Wv0eZ3o-Q6cCW6khUz_T_TydyheXmVZwYoXpR5R-YIsRe6lIazP-7h4Qzbj4hEzSyq3HgY7ix1o7FVS1Hc8lA", needle: "Bayonet" },
      { name: "Butterfly Knife", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsBn6v1ut0o95kSi26gBBp5GSEn9_8diiVbVV1CJJyReFc5kLtwYDlY-y34QDW2oJDxSX5iikf7jErvbjdpassNw", needle: "Butterfly" },
    ],
  },
  {
    id: "pistol",
    label: "Пистолет",
    items: [
      { name: "P250", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiBJ-uavZK1-NM-SHGSYyPpzs_V8XSyMmRQguynLn974cXzGPAYgXpV4F-4NtRK6l4LkP7i35lSIgt1Nny6thnhA7SdtsPFCD_QCdWsc4g", needle: "P250" },
      { name: "Glock-18", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1c4_2tY5tnJOCWC2yvzOtyufRkASjklhhwtzmGyI77dCjFOAEjXsQmRuFYs0TtxNflM7u04gaI3Y1MmX_gznQeT_sZuyk", needle: "Glock-18" },
      { name: "USP-S", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSIf2sCmOAwPpJoPR7XyW2qhEutDWR1N-rcHPBPFMiDZUkF-9Z4ETtxtDkYu3js1ffg94Tnn2o3yMavH0957ocEf1yWMwziKM", needle: "USP-S" },
      { name: "Desert Eagle", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha-kBkupjDLz9_6c3mWPFBxX8N0EOMIsULpmtHjPuvq41bc2dhAzy3_2ngfvHpt5_FCD_RJLjxjaQ", needle: "Desert Eagle" },
    ],
  },
  {
    id: "rifle",
    label: "Винтовка",
    items: [
      { name: "AK-47", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-UGm-Zz-llj-xsSyCmmFMi5GrcwtivdnnCOgd2DsNxTeIJuxbqk9XuN-_i5gKI3d1BxH35iy1P8G81tKMOXOY4", needle: "AK-47" },
      { name: "M4A4", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_3HDzaD_ux6seJicCW8gQg0jDCAnobsLGWTbQQnDsN3QuYOtELqkIazZeLm7lPYj9gQzyj72y8du31i6ulQA6Rx5OSJ2CPXrFUp", needle: "M4A4" },
      { name: "FAMAS", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1d7v-ve5tvIfSHHG6A_uJ_t-l9AX6xzExytWndzdj6eCrGb1MkWZB2TOBc4xK8mtHkZezrsQOPjoITyi_gznQezHhrR0c", needle: "FAMAS" },
      { name: "Galil AR", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0OGhbZtiMvGdCWKvx-J_s-pWRyyygwRpsT-Azt2td3_EOgMoDJt0TbNftxe4wIbhMeO0tg2K3dlMynj2hyhMvzErvbgB7-03WA", needle: "Galil AR" },
    ],
  },
  {
    id: "sniper",
    label: "Снайперская",
    items: [
      { name: "AWP", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_DVL0OK8Yap5M-SBC2ad_uNztOh8QmexzUt1tj7UnN-vc3KWbw8nCpJzRrJY5xa8xNHuZOLr51bYjtkXyyj5kGoXuQMtNgKM", needle: "AWP" },
      { name: "G3SG1", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1Y-s2pO7dqcc-UAmaUxNF7teVgWiT9xUR36m_Wm9ioJX7FalAiD5AjRuYKsETsldW1ZOvg71eLgt8Qm33-jTQJsHiK03zX7w", needle: "G3SG1" },
      { name: "SCAR-20", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLinZfyr3Jk6OGRe6dsMs-VHGaXzOt4pPJWTSWylhYYvjiBk5r0b3mXZg5xDsYmQ-NetUK7kdzkP-jh5AaNgosUmCWr3Hga7iZpsroCA6U7uvqAa4cdOU4", needle: "SCAR-20" },
      { name: "SSG 08", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1a7s2oaaBoH_eBD3SDze94tN5lRi67gVN05G3QzI6pIn2UOAYhDJMjEeANsBbtlYC2ZbvltA2P2I5FyHmq2Hka8G81tCngBDgW", needle: "SSG 08" },
    ],
  },
  {
    id: "smg",
    label: "ПП",
    items: [
      { name: "MAC-10", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1Y-s2jaac8cM-AD2ybwOVjj-xsSyCmmFMk5mnRzdeqdSnCPVN2DpV3QeELtELrlIbiPrzqsVOMjdlBnySvjH5O8G81tOTP5a5f", needle: "MAC-10" },
      { name: "MP9", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f-jFk4uL3V7d5IeKfB2CY1dF7teVgWiT9wU0htTjWnI2qcHvEZgQlW5VyROAD50W6lYDnN-zi5QyM2YtGzir43zQJsHh8IziyOQ", needle: "MP9" },
      { name: "UMP-45", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1O4uL6PZtiLPSsDWaC1eF5vt5lRi67gVN2tWXTzI6tc3rGPQ4kWJUiQrJf4RPskIW2ZO3r4VaKi9hFyX-qhy0a8G81tA_18T9p", needle: "UMP-45" },
    ],
  },
  {
    id: "shotgun",
    label: "Дробовик",
    items: [
      { name: "Nova", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwjZJ7vugV7dlIeCWHVjAkNF6ueZhW2ewkUhysW6AzIqvdH2eOFQpC5ZzQeNc5kG8wNeyNL-w4wbfjNgRzn78kGoXuS8lQPk9", needle: "Nova" },
      { name: "XM1014", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk9___OPU5H_aBC26XyfpJvOhuRz39xkh_5DjRmYr8IHyXZlIjX8NxQrQJ4xSxk9flZL-0sgOIi4NGySishjQJsHhKqh3UFQ", needle: "XM1014" },
      { name: "MAG-7", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wiFO0P-vb_NSLf-dHXOV09F1se1lcCW6khUz_WncmIz8JHmTa1JyApd5FLEMsES-kNDhM-3i5QKM2Y5AzSr9jngY6Cp1o7FV7cAHRyI", needle: "MAG-7" },
    ],
  },
  {
    id: "gloves",
    label: "Перчатки",
    items: [
      { name: "Sport Gloves", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-OfB2mX0uZ5pN5hSiiljFMm4WTUyN6pcC2VawEnCcElRu5Y4UPtlIDnNOvj7gTX3opHzn_5iH4a8G81tDmtA2DM", needle: "Sport Gloves" },
      { name: "Driver Gloves", icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5t-NPmHDW-VxdFxouRsQRa0hxg-jDCAnobsLGXEOwR0DsElQe4LuhjqwN2xNurn5waM2t5Byn762iNPvX1u4O8HB_Is5OSJ2OhUO7vy", needle: "Driver Gloves" },
    ],
  },
  {
    id: "agent",
    label: "Агент",
    items: [
      {
        name: "Sir Bloody Darryl Royale",
        icon: "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIa-2lmxU-LR0dnuNm6E8Vl45Iv181z1fgn8oYby8iRe_OGnZ6psLM-FD3WWkqAg6ec5THznk05-4jvXntz7JHjBOwYkDZAhQrZfskXuw9HiN-m3tAfclcsbmmRuIYiQ",
        needle: "Sir Bloody",
      },
    ],
  },
];

function getActiveCategoryNeedles() {
  const bar = document.getElementById("buyCategoryBar");
  if (!bar) return [];
  return [...bar.querySelectorAll(".buy-cat-item:checked")]
    .map((cb) => cb.getAttribute("data-needle") || "")
    .filter(Boolean);
}

function closeAllBuyCategoryPanels() {
  const bar = document.getElementById("buyCategoryBar");
  if (!bar) return;
  bar.querySelectorAll(".buy-cat--open").forEach((w) => w.classList.remove("buy-cat--open"));
  bar.querySelectorAll(".buy-cat-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
}

function syncBuyCatSelectAll(panel) {
  const allCb = panel.querySelector(".buy-cat-all");
  const items = [...panel.querySelectorAll(".buy-cat-item")];
  if (!allCb || !items.length) return;
  const n = items.filter((cb) => cb.checked).length;
  if (n === 0) {
    allCb.checked = false;
    allCb.indeterminate = false;
  } else if (n === items.length) {
    allCb.checked = true;
    allCb.indeterminate = false;
  } else {
    allCb.checked = false;
    allCb.indeterminate = true;
  }
}

const BUY_CAT_TRIGGER_CHEV = `<span class="buy-cat-trigger-chev" aria-hidden="true"><svg class="buy-cat-trigger-chev-svg" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.75L6 6.25l4.5-4.5" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

function buildBuyCategoryBar() {
  const bar = document.getElementById("buyCategoryBar");
  if (!bar) return;
  bar.innerHTML = "";
  const tray = document.createElement("div");
  tray.className = "buy-category-tray";
  bar.appendChild(tray);
  for (const cat of BUY_CATEGORY_DROPDOWNS) {
    const wrap = document.createElement("div");
    wrap.className = "buy-cat";
    wrap.id = `buy-cat-${cat.id}`;

    const panelId = `buy-cat-panel-${cat.id}`;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "buy-cat-trigger";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-controls", panelId);
    trigger.innerHTML = `<span class="buy-cat-trigger-label">${escapeHtml(cat.label)}</span>${BUY_CAT_TRIGGER_CHEV}`;

    const panel = document.createElement("div");
    panel.className = "buy-cat-panel";
    panel.id = panelId;
    panel.setAttribute("role", "listbox");
    panel.setAttribute("aria-label", cat.label);

    const rowAll = document.createElement("label");
    rowAll.className = "buy-cat-row buy-cat-row--all";
    rowAll.innerHTML = `<span class="buy-cat-name">Выбрать все</span><input type="checkbox" class="buy-cat-all" aria-label="Выбрать все: ${escapeAttr(cat.label)}" />`;
    panel.appendChild(rowAll);

    for (const it of cat.items) {
      const src = steamEconomyThumb(it.icon);
      const row = document.createElement("label");
      row.className = "buy-cat-row";
      row.innerHTML = `
        <span class="buy-cat-thumb-wrap"><img class="buy-cat-thumb" src="${escapeAttr(src)}" alt="" width="52" height="24" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span>
        <span class="buy-cat-name">${escapeHtml(it.name)}</span>
        <input type="checkbox" class="buy-cat-item" data-needle="${escapeAttr(it.needle)}" aria-label="${escapeAttr(it.name)}" />
      `;
      panel.appendChild(row);
    }

    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    tray.appendChild(wrap);
  }
}

function wireBuyCategoryBar() {
  const bar = document.getElementById("buyCategoryBar");
  if (!bar) return;

  bar.addEventListener("click", (e) => {
    const tr = e.target.closest(".buy-cat-trigger");
    if (!tr || !bar.contains(tr)) return;
    e.preventDefault();
    const wrap = tr.closest(".buy-cat");
    const wasOpen = wrap.classList.contains("buy-cat--open");
    bar.querySelectorAll(".buy-cat--open").forEach((w) => {
      w.classList.remove("buy-cat--open");
      w.querySelector(".buy-cat-trigger")?.setAttribute("aria-expanded", "false");
    });
    if (!wasOpen) {
      wrap.classList.add("buy-cat--open");
      tr.setAttribute("aria-expanded", "true");
    }
  });

  bar.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "checkbox") return;
    const panel = t.closest(".buy-cat-panel");
    if (!panel) return;
    if (t.classList.contains("buy-cat-all")) {
      panel.querySelectorAll(".buy-cat-item").forEach((cb) => {
        cb.checked = t.checked;
      });
      t.indeterminate = false;
    } else if (t.classList.contains("buy-cat-item")) {
      syncBuyCatSelectAll(panel);
    }
    applyFiltersAndRender();
  });

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest?.("#buyCategoryRibbon")) return;
      closeAllBuyCategoryPanels();
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAllBuyCategoryPanels();
  });
}

function wireBuyCategoryRibbonScroll() {
  const vp = document.getElementById("buyCategoryViewport");
  const prev = document.getElementById("buyCatScrollPrev");
  const next = document.getElementById("buyCatScrollNext");
  if (!vp || !prev || !next) return;

  const step = () => Math.max(160, Math.floor(vp.clientWidth * 0.55));

  function syncScrollButtons() {
    const { scrollLeft, scrollWidth, clientWidth } = vp;
    const max = Math.max(0, scrollWidth - clientWidth);
    prev.disabled = scrollLeft <= 2;
    next.disabled = scrollLeft >= max - 2;
  }

  prev.addEventListener("click", () => {
    vp.scrollBy({ left: -step(), behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    vp.scrollBy({ left: step(), behavior: "smooth" });
  });
  vp.addEventListener("scroll", syncScrollButtons, { passive: true });
  window.addEventListener("resize", syncScrollButtons);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(syncScrollButtons);
    ro.observe(vp);
  }
  syncScrollButtons();
}

function listingTitle(L) {
  return (L.itemName && String(L.itemName).trim()) || "Предмет CS2";
}

function getFilteredList() {
  let list = [...rawListings];
  const q = ($("#buySearch") && $("#buySearch").value.trim().toLowerCase()) || "";
  if (q) {
    list = list.filter((L) => {
      const t = listingTitle(L).toLowerCase();
      const seller = String(L.sellerName || "").toLowerCase();
      const asset = String(L.assetid || "");
      return t.includes(q) || seller.includes(q) || asset.includes(q);
    });
  }
  const minP = Number($("#buyPriceMin") && $("#buyPriceMin").value);
  const maxP = Number($("#buyPriceMax") && $("#buyPriceMax").value);
  if (Number.isFinite(minP) && minP > 0) {
    list = list.filter((L) => Number(L.priceRub) >= minP);
  }
  if (Number.isFinite(maxP) && maxP > 0) {
    list = list.filter((L) => Number(L.priceRub) <= maxP);
  }
  const needles = getActiveCategoryNeedles();
  if (needles.length) {
    list = list.filter((L) => {
      const t = listingTitle(L).toLowerCase();
      return needles.some((n) => t.includes(n.toLowerCase()));
    });
  }
  const sort = ($("#buySort") && $("#buySort").value) || "price-asc";
  if (sort === "price-asc") list.sort((a, b) => Number(a.priceRub) - Number(b.priceRub));
  else if (sort === "price-desc") list.sort((a, b) => Number(b.priceRub) - Number(a.priceRub));
  else if (sort === "name-asc") list.sort((a, b) => listingTitle(a).localeCompare(listingTitle(b), "ru"));
  else if (sort === "name-desc") list.sort((a, b) => listingTitle(b).localeCompare(listingTitle(a), "ru"));
  return list;
}

function renderListingRows(list) {
  const host = $("#listingsGrid");
  host.innerHTML = "";
  for (const L of list) {
    const row = document.createElement("div");
    row.className = "listing-row";
    const steamProfile = `https://steamcommunity.com/profiles/${L.sellerSteamId}`;
    const tradeBtn = L.tradeOfferUrl
      ? `<a class="btn btn-primary btn-sm" href="${escapeAttr(L.tradeOfferUrl)}" target="_blank" rel="noopener noreferrer">Предложить обмен</a>`
      : `<span class="muted small">Нет Trade URL</span>`;
    const title = listingTitle(L);
    const icon = L.itemIcon && String(L.itemIcon).trim().startsWith("https://") ? String(L.itemIcon).trim() : "";
    const thumb = icon
      ? `<img class="listing-thumb" src="${escapeAttr(icon)}" alt="" width="72" height="72" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : `<div class="listing-thumb listing-thumb--placeholder" title="Нет превью: инвентарь продавца закрыт или предмет не найден"></div>`;
    const noteLine =
      L.note && String(L.note).trim()
        ? `<div class="muted small">${escapeHtml(L.note)}</div>`
        : `<div class="muted small">Предмет из инвентаря CS2</div>`;
    row.innerHTML = `
      <div class="listing-row-main">
        ${thumb}
        <div class="listing-row-text">
          <div class="listing-item-title">${escapeHtml(title)}</div>
          <div class="muted small">${escapeHtml(L.sellerName)} · asset ${escapeHtml(L.assetid)}</div>
          ${noteLine}
        </div>
      </div>
      <div class="listing-row-actions">
        <span><strong>${L.priceRub} ₽</strong></span>
        ${tradeBtn}
        <a class="btn btn-ghost btn-sm" href="${steamProfile}" target="_blank" rel="noopener">Профиль Steam</a>
        ${
          currentUser && currentUser.steamId === L.sellerSteamId
            ? `<button type="button" class="btn btn-ghost btn-sm" data-del="${escapeAttr(L.id)}">Снять</button>`
            : ""
        }
      </div>
    `;
    host.appendChild(row);
  }
  host.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      await fetch("/api/listings/" + encodeURIComponent(id), { method: "DELETE" });
      loadListings();
    });
  });
}

function applyFiltersAndRender() {
  const host = $("#listingsGrid");
  if (!host) return;
  if (!rawListings.length) {
    host.innerHTML = '<p class="muted">Пока нет объявлений.</p>';
    return;
  }
  const list = getFilteredList();
  if (!list.length) {
    host.innerHTML = '<p class="muted">Нет объявлений по выбранным фильтрам.</p>';
    return;
  }
  renderListingRows(list);
}

async function loadListings() {
  const host = $("#listingsGrid");
  if (!host) return;
  host.innerHTML = '<p class="muted">Загрузка…</p>';
  try {
    const r = await fetch("/api/listings");
    const data = await r.json();
    rawListings = data.listings || [];
    applyFiltersAndRender();
  } catch {
    host.innerHTML = '<p class="muted">Не удалось загрузить объявления.</p>';
    rawListings = [];
  }
}

function resetBuyFilters() {
  const s = $("#buySearch");
  const min = $("#buyPriceMin");
  const max = $("#buyPriceMax");
  const sort = $("#buySort");
  if (s) s.value = "";
  if (min) min.value = "";
  if (max) max.value = "";
  if (sort) sort.selectedIndex = 0;
  const all = document.querySelector('input[name="buyDelivery"][value="all"]');
  if (all) all.checked = true;
  ["buyChSt", "buyChSouv", "buyChTag"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  document.querySelectorAll(".buy-filter-fold[open]").forEach((d) => d.removeAttribute("open"));
  const bar = document.getElementById("buyCategoryBar");
  if (bar) {
    bar.querySelectorAll(".buy-cat-item, .buy-cat-all").forEach((el) => {
      el.checked = false;
      if (el.classList.contains("buy-cat-all")) el.indeterminate = false;
    });
    bar.querySelectorAll(".buy-cat--open").forEach((w) => w.classList.remove("buy-cat--open"));
    bar.querySelectorAll(".buy-cat-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
  }
  applyFiltersAndRender();
}

function wireBuyChrome() {
  $("#buySearch")?.addEventListener("input", () => applyFiltersAndRender());
  $("#buyPriceMin")?.addEventListener("input", () => applyFiltersAndRender());
  $("#buyPriceMax")?.addEventListener("input", () => applyFiltersAndRender());
  $("#buySort")?.addEventListener("change", () => applyFiltersAndRender());
  $("#buyRefreshToolbar")?.addEventListener("click", () => loadListings());
  $("#buyFilterReset")?.addEventListener("click", () => resetBuyFilters());
  $("#buyPriceRefresh")?.addEventListener("click", () => {
    const min = $("#buyPriceMin");
    const max = $("#buyPriceMax");
    if (min) min.value = "";
    if (max) max.value = "";
    applyFiltersAndRender();
  });
}

document.addEventListener("cs2orbitbalance", (ev) => {
  const n = ev.detail && typeof ev.detail.balanceRub === "number" ? ev.detail.balanceRub : null;
  if (currentUser && n !== null) currentUser.balanceRub = n;
});

async function init() {
  buildBuyCategoryBar();
  wireBuyCategoryBar();
  wireBuyCategoryRibbonScroll();
  wireBuyChrome();
  await refreshMe();
  await loadListings();
}

init();
