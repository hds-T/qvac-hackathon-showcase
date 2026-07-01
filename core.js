/* Shared helpers for all hackathon showcase layouts.
   Load order: data.js -> cover.js -> core.js -> page script. */
window.QH = (function () {
  const ICON = {
    github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22 0 1.6-.02 2.89-.02 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z"/></svg>',
    video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>',
    demo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7M21 3l-9 9M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>',
  };
  const LINK_LABEL = { github:"GitHub", video:"Video", x:"X / Twitter", demo:"Live demo" };

  const D = window.HACKATHON;
  const byId = {}; (D.tracks || []).forEach(t => byId[t.id] = t);

  function trackColor(p){ return (byId[p.track] && byId[p.track].color) || "#16E3C1"; }
  // if a real cover image fails to load, swap in the deterministic procedural cover
  window.__qcFallback = function(el){ el.outerHTML = qvacCover({ id: el.dataset.id, name: el.dataset.nm }, el.dataset.color); };
  function coverHTML(p){
    if (!p.image) return qvacCover(p, trackColor(p));
    const alt = String(p.name||"").replace(/"/g,"&quot;");
    return `<img src="${p.image}" alt="${alt}" loading="lazy" data-id="${p.id}" data-nm="${alt}" data-color="${trackColor(p)}" onerror="window.__qcFallback(this)">`;
  }
  function linkIcons(p){ return Object.keys(p.links||{}).filter(k=>ICON[k]).map(k=>ICON[k]).join(""); }
  function linkButtons(p){
    return Object.entries(p.links||{}).filter(([k])=>ICON[k]).map(([k,url],i)=>
      `<a class="lk ${i===0?'primary':''}" href="${url}" target="_blank" rel="noopener">${ICON[k]}${LINK_LABEL[k]}</a>`).join("");
  }

  // categories present in a given subset, ordered by meta.categories then extras
  function categoriesIn(list){
    const set = new Set(list.map(p=>p.category));
    const order = D.meta.categories || [];
    return order.filter(c=>set.has(c)).concat([...set].filter(c=>!order.includes(c)));
  }
  function filterBy(track, cat){
    return D.projects.filter(p => (track==="all"||p.track===track) && (cat==="all"||p.category===cat));
  }

  // detail field/meta HTML, reused by modal / drawer
  function detailMeta(p){
    const t = byId[p.track];
    const row = (k,v)=> v ? `<div class="m-field"><div class="k">${k}</div><div class="v">${v}</div></div>` : "";
    return row("Team",p.team) + row("Company",p.company)
      + `<div class="m-field"><div class="k">Track</div><div class="v" style="color:${t.color}">${t.name}</div></div>`
      + `<div class="m-field"><div class="k">Category</div><div class="v">${p.category}</div></div>`;
  }

  return { D, byId, ICON, LINK_LABEL, trackColor, coverHTML, linkIcons, linkButtons, categoriesIn, filterBy, detailMeta };
})();
