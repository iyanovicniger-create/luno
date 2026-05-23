(function () {
  const mount = document.getElementById("siteNavMount");
  if (!mount) return;

  const active = document.body.getAttribute("data-nav") || "";
  const s = { cap: "round", join: "round", w: 1.75 };
  const o = (extra) =>
    `fill="none" stroke="currentColor" stroke-width="${s.w}" stroke-linecap="${s.cap}" stroke-linejoin="${s.join}"${extra ? " " + extra : ""}`;

  const iconSell = `<svg class="site-nav__svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2" ${o()}/><path d="M2.5 10h19" ${o()}/><circle cx="17" cy="15" r="3.2" ${o()}/><text x="14.85" y="16.85" font-size="5.2" fill="currentColor" font-family="system-ui,sans-serif" font-weight="800">$</text></svg>`;

  const iconBuy = `<svg class="site-nav__svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="8.5" ${o()}/><path d="M9 14.5V13l1-1h2l1.2-1H16v1.2h-2.5L12.5 13H10.2L9.5 13.7v.8H9z" ${o()}/><path d="M14.5 10.2h3v1.3h-3zM9.2 14.5h5.6v1.2H9.2z" ${o()}/></svg>`;

  const iconFaq = `<svg class="site-nav__svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="8.5" ${o()}/><path d="M9.25 9.4c0-1.5 1.25-2.65 2.75-2.65s2.75 1.1 2.75 2.5c0 1.9-2.75 2-2.75 4.1" ${o()}/><circle cx="12" cy="17.35" r="0.85" fill="currentColor" stroke="none"/></svg>`;

  const iconBlog = `<svg class="site-nav__svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="5" y="3.5" width="11" height="15" rx="1.5" ${o()}/><path d="M7.5 7.5h6 M7.5 10.5h6 M7.5 13.5h4" ${o()}/><path d="M13.5 5.5l5 5-6.2 6.2a1.2 1.2 0 0 1-1.7 0l-1.1-1.1a1.2 1.2 0 0 1 0-1.7L16 8" ${o()}/></svg>`;

  const items = [
    { id: "sell", href: "/sell", label: "Продать скины", icon: iconSell },
    { id: "buy", href: "/buy", label: "Купить скины", icon: iconBuy },
    { id: "faq", href: "/faq", label: "FAQ", icon: iconFaq },
    { id: "blog", href: "/blog", label: "Блог", icon: iconBlog },
  ];

  mount.innerHTML = `
    <ul class="site-nav__list">
      ${items
        .map(
          (p) => `
        <li class="site-nav__item">
          <a class="site-nav__link${active === p.id ? " is-active" : ""}" href="${p.href}">
            <span class="site-nav__ico">${p.icon}</span>
            <span class="site-nav__txt">${p.label}</span>
          </a>
        </li>`
        )
        .join("")}
    </ul>`;
})();

/** Замените на ссылки своих сообществ */
const SOCIAL_URLS = {
  tiktok: "https://www.tiktok.com/",
  youtube: "https://www.youtube.com/",
  vk: "https://vk.com/",
  telegram: "https://t.me/telegram",
};

(function mountSocialFooter() {
  const el = document.getElementById("socialFooterMount");
  if (!el) return;

  const iconTikTok = `<svg class="social-footer__svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M19.59 6.69A4.83 4.83 0 0 1 15.82 2.44V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64c.3.04.6.1.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 1 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52V5.79a4.85 4.85 0 0 1-1-.1z"/></svg>`;

  const iconYouTube = `<svg class="social-footer__svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.7 31.7 0 0 0 .5-5.8 31.7 31.7 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>`;

  const iconVk = `<svg class="social-footer__svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.75"/><text x="12" y="15.2" text-anchor="middle" font-size="8.5" font-weight="800" fill="currentColor" font-family="system-ui,Segoe UI,sans-serif">vk</text></svg>`;

  const iconTelegram = `<svg class="social-footer__svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.23.14.33-.01.06.01.24 0 .38z"/></svg>`;

  const links = [
    { href: SOCIAL_URLS.tiktok, label: "TikTok", icon: iconTikTok },
    { href: SOCIAL_URLS.youtube, label: "YouTube", icon: iconYouTube },
    { href: SOCIAL_URLS.vk, label: "ВКонтакте", icon: iconVk },
    { href: SOCIAL_URLS.telegram, label: "Telegram", icon: iconTelegram },
  ];

  el.innerHTML = `
    <nav class="social-footer" aria-label="Социальные сети">
      ${links
        .map(
          (L) => `
        <a class="social-footer__link" href="${L.href}" target="_blank" rel="noopener noreferrer" title="${L.label}">
          <span class="social-footer__ico">${L.icon}</span>
          <span class="visually-hidden">${L.label}</span>
        </a>`
        )
        .join("")}
    </nav>`;
})();
