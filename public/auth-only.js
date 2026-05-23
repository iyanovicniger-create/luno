const $ = (sel) => document.querySelector(sel);

async function refreshAuthHeader() {
  const r = await fetch("/api/me");
  const data = await r.json();
  const user = data.user;
  const btnLogin = $("#btnLogin");
  const userBox = $("#userBox");
  if (!btnLogin || !userBox) return;
  if (user) {
    btnLogin.classList.add("hidden");
    userBox.classList.remove("hidden");
    $("#avatar").src = user.avatar || "";
    $("#avatar").alt = user.displayName;
    $("#userName").textContent = user.displayName;
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(user);
  } else {
    btnLogin.classList.remove("hidden");
    userBox.classList.add("hidden");
    window.CS2OrbitAuthHeader?.updateBalanceDisplay(null);
  }
}

refreshAuthHeader();
