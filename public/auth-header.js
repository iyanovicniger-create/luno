(function () {
  function formatRub(n) {
    const x = Math.max(0, Math.floor(Number(n) || 0));
    return new Intl.NumberFormat("ru-RU").format(x) + "\u00A0₽";
  }

  function updateBalanceDisplay(user) {
    const el = document.getElementById("userBalanceValue");
    if (!el) return;
    const v = user && typeof user.balanceRub === "number" ? user.balanceRub : 0;
    el.textContent = formatRub(v);
  }

  function initTopup() {
    const btn = document.getElementById("btnBalanceTopup");
    const dlg = document.getElementById("modalTopup");
    const cancel = document.getElementById("modalTopupCancel");
    const form = document.getElementById("formTopup");
    if (!btn || !dlg || !form) return;

    btn.addEventListener("click", () => dlg.showModal());
    if (cancel) cancel.addEventListener("click", () => dlg.close());

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const amountRub = Number(fd.get("amount"));
      if (!Number.isFinite(amountRub) || amountRub < 1 || amountRub > 500000) {
        alert("Укажите сумму от 1 до 500 000 ₽");
        return;
      }
      try {
        const r = await fetch("/api/balance/top-up", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountRub: Math.floor(amountRub) }),
        });
        const raw = await r.text();
        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = {};
        }
        if (!r.ok) {
          const hint =
            data.error ||
            (r.status === 404 && raw.includes("Cannot POST")
              ? "Сервер без маршрута пополнения — перезапустите Node (npm start)."
              : null) ||
            (raw && raw.length < 200 ? raw.trim() : null) ||
            `Ошибка ${r.status}`;
          throw new Error(hint);
        }
        updateBalanceDisplay({ balanceRub: data.balanceRub });
        window.dispatchEvent(
          new CustomEvent("cs2orbitbalance", { detail: { balanceRub: data.balanceRub } })
        );
        dlg.close();
      } catch (e) {
        alert(e.message);
      }
    });
  }

  window.CS2OrbitAuthHeader = { updateBalanceDisplay };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopup);
  } else {
    initTopup();
  }
})();
