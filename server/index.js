const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;

const CS2_APP_ID = 730;
const CS2_CONTEXT = 2;

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const STEAM_API_KEY = process.env.STEAM_API_KEY || "";

const listingsFile = path.join(__dirname, "..", "data", "listings.json");
const tradeUrlsFile = path.join(__dirname, "..", "data", "trade_urls.json");
const balancesFile = path.join(__dirname, "..", "data", "balances.json");

const STEAM_ID64_BASE = 76561197960265728n;

function steamId64ToPartner(steamId64) {
  try {
    return (BigInt(String(steamId64)) - STEAM_ID64_BASE).toString();
  } catch {
    return null;
  }
}

function parseSteamTradeUrl(raw) {
  const s = String(raw || "").trim();
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (!/^steamcommunity\.com$/i.test(u.hostname)) return null;
  const pathLower = u.pathname.toLowerCase();
  if (!/^\/tradeoffer\/new\/?$/i.test(u.pathname)) return null;
  const partner = u.searchParams.get("partner");
  const token = u.searchParams.get("token");
  if (!partner || !token) return null;
  if (!/^\d+$/.test(partner)) return null;
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(token)) return null;
  const canonical = `https://steamcommunity.com/tradeoffer/new/?partner=${encodeURIComponent(partner)}&token=${encodeURIComponent(token)}`;
  return { partner, token, canonical };
}

function tradeUrlBelongsToSteamId(parsed, steamId64) {
  const expected = steamId64ToPartner(steamId64);
  return expected !== null && parsed.partner === expected;
}

function loadTradeUrlMap() {
  try {
    const raw = fs.readFileSync(tradeUrlsFile, "utf8");
    const obj = JSON.parse(raw);
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch {
    return {};
  }
}

function saveTradeUrlMap(map) {
  const dir = path.dirname(tradeUrlsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tradeUrlsFile, JSON.stringify(map, null, 2), "utf8");
}

function loadBalances() {
  try {
    const raw = fs.readFileSync(balancesFile, "utf8");
    const o = JSON.parse(raw);
    return typeof o === "object" && o !== null ? o : {};
  } catch {
    return {};
  }
}

function saveBalances(map) {
  const dir = path.dirname(balancesFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(balancesFile, JSON.stringify(map, null, 2), "utf8");
}

function getBalanceRub(steamId64) {
  const v = loadBalances()[String(steamId64)];
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** @returns новый баланс после зачисления */
function addBalanceRub(steamId64, deltaRub) {
  const map = loadBalances();
  const key = String(steamId64);
  const cur = Number(map[key]);
  const base = Number.isFinite(cur) && cur >= 0 ? Math.floor(cur) : 0;
  const next = base + Math.floor(deltaRub);
  map[key] = next;
  saveBalances(map);
  return next;
}

function getStoredTradeUrl(steamId64) {
  const map = loadTradeUrlMap();
  const url = map[String(steamId64)];
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

function setStoredTradeUrl(steamId64, canonicalUrl) {
  const map = loadTradeUrlMap();
  map[String(steamId64)] = canonicalUrl;
  saveTradeUrlMap(map);
}

function deleteStoredTradeUrl(steamId64) {
  const map = loadTradeUrlMap();
  delete map[String(steamId64)];
  saveTradeUrlMap(map);
}

function loadListings() {
  try {
    const raw = fs.readFileSync(listingsFile, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveListings(list) {
  const dir = path.dirname(listingsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(listingsFile, JSON.stringify(list, null, 2), "utf8");
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (!STEAM_API_KEY) {
  console.warn("[warn] STEAM_API_KEY не задан. Добавьте ключ в .env (https://steamcommunity.com/dev/apikey)");
}

passport.use(
  new SteamStrategy(
    {
      returnURL: `${PUBLIC_URL}/auth/steam/return`,
      realm: PUBLIC_URL,
      apiKey: STEAM_API_KEY || "00000000000000000000000000000000",
    },
    (identifier, profile, done) => {
      const id = profile.id;
      const displayName = profile.displayName;
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : "";
      done(null, { steamId: id, displayName, avatar });
    }
  )
);

const app = express();

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

const publicDir = path.resolve(__dirname, "..", "public");
function sendPublicPage(name) {
  const abs = path.resolve(publicDir, name);
  return (req, res) => res.sendFile(abs);
}
app.get("/", sendPublicPage("sell.html"));
app.get("/sell", sendPublicPage("sell.html"));
app.get("/buy", sendPublicPage("buy.html"));
app.get("/faq", sendPublicPage("faq.html"));
app.get("/blog", sendPublicPage("blog.html"));

function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Нужна авторизация Steam" });
  next();
}

app.get("/auth/steam", passport.authenticate("steam"));

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/sell?login=fail" }),
  (req, res) => res.redirect("/sell")
);

app.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error(err);
    res.redirect("/sell");
  });
});

app.get("/api/me", (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({
    user: {
      ...req.user,
      tradeUrlLinked: !!getStoredTradeUrl(req.user.steamId),
      balanceRub: getBalanceRub(req.user.steamId),
    },
  });
});

app.post("/api/balance/top-up", requireUser, (req, res) => {
  try {
    const n = Number(req.body && req.body.amountRub);
    if (!Number.isFinite(n) || n < 1 || n > 500000 || Math.floor(n) !== n) {
      return res.status(400).json({ error: "Сумма: целое число от 1 до 500 000 ₽" });
    }
    const balanceRub = addBalanceRub(req.user.steamId, n);
    res.json({ balanceRub });
  } catch (e) {
    console.error("[balance top-up]", e);
    res.status(500).json({ error: "Не удалось сохранить баланс (проверьте доступ к папке data)." });
  }
});

app.get("/api/trade-url", requireUser, (req, res) => {
  const url = getStoredTradeUrl(req.user.steamId);
  res.json({ linked: !!url });
});

app.post("/api/trade-url", requireUser, (req, res) => {
  const { tradeUrl } = req.body || {};
  const parsed = parseSteamTradeUrl(tradeUrl);
  if (!parsed) {
    return res.status(400).json({
      error:
        "Нужна полная ссылка вида https://steamcommunity.com/tradeoffer/new/?partner=…&token=… (из инвентаря Steam → Обмен → Создать ссылку на обмен)",
    });
  }
  if (!tradeUrlBelongsToSteamId(parsed, req.user.steamId)) {
    return res.status(400).json({
      error: "Ссылка не от вашего аккаунта: partner в URL не совпадает с вашим Steam ID. Скопируйте ссылку из своего клиента Steam.",
    });
  }
  setStoredTradeUrl(req.user.steamId, parsed.canonical);
  res.json({ ok: true, linked: true });
});

app.delete("/api/trade-url", requireUser, (req, res) => {
  deleteStoredTradeUrl(req.user.steamId);
  res.json({ ok: true, linked: false });
});

/** Steam часто отвечает HTTP 400 на count=5000; пагинация через last_assetid. */
const INVENTORY_PAGE_SIZES = [2000, 500];

async function fetchCs2InventoryPage(steamId64, count, startAssetid) {
  const qs = new URLSearchParams({ l: "english", count: String(count) });
  if (startAssetid != null && String(startAssetid) !== "") qs.set("start_assetid", String(startAssetid));
  const url = `https://steamcommunity.com/inventory/${encodeURIComponent(steamId64)}/${CS2_APP_ID}/${CS2_CONTEXT}?${qs}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
  });
  const text = await r.text().catch(() => "");
  if (!r.ok) {
    const snippet = text && text !== "null" ? text.slice(0, 200) : r.statusText || "empty body";
    const err = new Error(`Steam inventory HTTP ${r.status}: ${snippet}`);
    err._steamBody = text;
    err._steamStatus = r.status;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Steam inventory: не JSON (${text.slice(0, 120)})`);
  }
}

async function fetchCs2Inventory(steamId64) {
  const id = String(steamId64).replace(/\D/g, "");
  if (!/^\d{17}$/.test(id)) throw new Error("Некорректный Steam ID64 для инвентаря");

  const assets = [];
  const descriptions = [];
  const seenDescKey = new Set();
  let startAssetid = null;
  let pageSize = INVENTORY_PAGE_SIZES[0];
  let pages = 0;

  while (pages < 40) {
    pages += 1;
    let data;
    try {
      data = await fetchCs2InventoryPage(id, pageSize, startAssetid);
    } catch (e) {
      if (e._steamStatus === 400 && pageSize === INVENTORY_PAGE_SIZES[0]) {
        pageSize = INVENTORY_PAGE_SIZES[1];
        continue;
      }
      throw e;
    }

    if (!data.success) throw new Error("Инвентарь недоступен (профиль закрыт или пусто)");

    for (const a of data.assets || []) assets.push(a);
    for (const d of data.descriptions || []) {
      const key = `${d.classid}_${d.instanceid || "0"}`;
      if (!seenDescKey.has(key)) {
        seenDescKey.add(key);
        descriptions.push(d);
      }
    }

    if (data.more_items && data.last_assetid != null) {
      startAssetid = data.last_assetid;
      continue;
    }
    break;
  }

  return { success: 1, assets, descriptions };
}

function mergeInventory(data) {
  const descByClass = {};
  for (const d of data.descriptions || []) {
    const key = `${d.classid}_${d.instanceid || "0"}`;
    descByClass[key] = d;
  }
  const items = [];
  for (const a of data.assets || []) {
    const key = `${a.classid}_${a.instanceid || "0"}`;
    const desc = descByClass[key];
    if (!desc) continue;
    const tradable = desc.tradable === 1;
    items.push({
      assetid: a.assetid,
      classid: a.classid,
      instanceid: a.instanceid || "0",
      amount: a.amount,
      name: desc.name,
      market_hash_name: desc.market_hash_name,
      icon: desc.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}` : "",
      tradable,
      commodity: desc.commodity === 1,
      type: desc.type || "",
    });
  }
  return items;
}

app.get("/api/inventory", requireUser, async (req, res) => {
  try {
    const raw = await fetchCs2Inventory(req.user.steamId);
    const items = mergeInventory(raw);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(502).json({
      error: e.message || "Не удалось загрузить инвентарь",
      hint: "Профиль Steam должен быть публичным, а инвентарь CS2 — открытым в настройках конфиденциальности.",
    });
  }
});

/** Кэш инвентаря для подстановки превью в старых объявлениях без itemIcon. */
const listingInvCache = new Map();
const LISTING_INV_TTL_MS = 90_000;

async function getCachedSellerItems(steamId64) {
  const sid = String(steamId64);
  const now = Date.now();
  const hit = listingInvCache.get(sid);
  if (hit && now - hit.t < LISTING_INV_TTL_MS) return hit.items;
  try {
    const raw = await fetchCs2Inventory(sid);
    const items = mergeInventory(raw);
    listingInvCache.set(sid, { t: now, items });
    return items;
  } catch (e) {
    console.warn("[listings] enrich inventory", sid, e.message || e);
    return null;
  }
}

function listingNeedsVisualEnrich(l) {
  return !String(l.itemName || "").trim() || !String(l.itemIcon || "").trim();
}

app.get("/api/listings", async (req, res) => {
  const list = loadListings();
  const active = list.filter((l) => l.active !== false);
  const sellersToFetch = new Set();
  for (const l of active) {
    if (listingNeedsVisualEnrich(l)) sellersToFetch.add(l.sellerSteamId);
  }
  await Promise.all(
    [...sellersToFetch].map((sid) => getCachedSellerItems(sid))
  );

  let dirty = false;
  for (const l of active) {
    if (!listingNeedsVisualEnrich(l)) continue;
    const items = listingInvCache.get(String(l.sellerSteamId))?.items;
    if (!items || !items.length) continue;
    const it = items.find((x) => String(x.assetid) === String(l.assetid));
    if (!it) continue;
    const idx = list.findIndex((row) => row.id === l.id);
    if (idx === -1) continue;
    const row = list[idx];
    if (!String(row.itemName || "").trim() && it.name) {
      row.itemName = String(it.name).slice(0, 200);
      dirty = true;
    }
    const icon = sanitizeItemIcon(row.itemIcon || it.icon);
    if (!String(row.itemIcon || "").trim() && icon) {
      row.itemIcon = icon;
      dirty = true;
    }
    if (!String(row.marketHashName || "").trim() && it.market_hash_name) {
      row.marketHashName = String(it.market_hash_name).slice(0, 220);
      dirty = true;
    }
  }
  if (dirty) saveListings(list);

  const listings = active.map((l) => {
    const tradeOfferUrl = getStoredTradeUrl(l.sellerSteamId);
    return { ...l, tradeOfferUrl: tradeOfferUrl || null };
  });
  res.json({ listings });
});

function sanitizeItemIcon(raw) {
  const s = String(raw || "").trim().slice(0, 4096);
  if (!s) return "";
  let u;
  try {
    u = new URL(s);
  } catch {
    return "";
  }
  if (u.protocol !== "https:") return "";
  if (!/\/economy\/image\//i.test(u.pathname)) return "";
  const host = u.hostname.toLowerCase();
  const okHost =
    host.endsWith("steamstatic.com") ||
    host.endsWith("steamusercontent.com") ||
    (host.includes("akamaihd.net") && /\/economy\/image\//i.test(u.pathname));
  if (!okHost) return "";
  return s.slice(0, 4096);
}

app.post("/api/listings", requireUser, (req, res) => {
  if (!getStoredTradeUrl(req.user.steamId)) {
    return res.status(400).json({
      error: "Сначала привяжите Steam Trade URL в блоке ниже — иначе покупатель не сможет отправить вам обмен.",
    });
  }
  const { assetid, priceRub, note, itemName, itemIcon, marketHashName } = req.body || {};
  const price = Number(priceRub);
  if (!assetid || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: "Укажите assetid и цену в рублях" });
  }
  const list = loadListings();
  const id = `L${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const icon = sanitizeItemIcon(itemIcon);
  const row = {
    id,
    sellerSteamId: req.user.steamId,
    sellerName: req.user.displayName,
    assetid: String(assetid),
    priceRub: price,
    note: String(note || "").slice(0, 200),
    itemName: String(itemName || "").trim().slice(0, 200),
    itemIcon: icon,
    marketHashName: String(marketHashName || "").trim().slice(0, 220),
    createdAt: new Date().toISOString(),
    active: true,
  };
  list.unshift(row);
  saveListings(list);
  res.json({ listing: row });
});

app.delete("/api/listings/:id", requireUser, (req, res) => {
  const list = loadListings();
  const i = list.findIndex((l) => l.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Не найдено" });
  if (list[i].sellerSteamId !== req.user.steamId) return res.status(403).json({ error: "Чужое объявление" });
  list[i].active = false;
  saveListings(list);
  res.json({ ok: true });
});

app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`CS2 Market: ${PUBLIC_URL}`);
  console.log("Страницы: / и /sell — продажа, /buy — витрина, /faq, /blog");
});
