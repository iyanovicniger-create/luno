const $ = (sel) => document.querySelector(sel);

async function refreshMe() {
  const r = await fetch("/api/me");
  const data = await r.json();
  const u = data.user;
  const btnLogin = $("#btnLogin");
  const userBox = $("#userBox");
  if (u) {
    btnLogin.classList.add("hidden");
    userBox.classList.remove("hidden");
    $("#avatar").src = u.avatar || "";
    $("#avatar").alt = u.displayName;
    $("#userName").textContent = u.displayName;
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(u);
  } else {
    btnLogin.classList.remove("hidden");
    userBox.classList.add("hidden");
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(null);
  }
}

refreshMe();
