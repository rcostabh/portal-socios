/* Portal dos Sócios — app do sócio + área da gestão */
(() => {
"use strict";
const CFG = window.PORTAL_CONFIG;
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } });
const $app = document.getElementById("app");

/* ---------- utilidades ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const NB = " ";
const fBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fBRL0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl0 = v => v == null || isNaN(v) ? "—" : fBRL0.format(v).replace(/\s/g, NB);
const brl = v => v == null || isNaN(v) ? "—" : fBRL.format(v).replace(/\s/g, NB);
const brlK = v => { if (v == null || isNaN(v)) return "—"; const a = Math.abs(v), s = v < 0 ? "−" : ""; if (a >= 1e6) return `${s}R$${NB}${(a / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${NB}mi`; if (a >= 1e3) return `${s}R$${NB}${(a / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${NB}mil`; return `${s}R$${NB}${a.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`; };
const pct = (v, d = 1) => v == null || !isFinite(v) ? "—" : (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const pnum = v => v == null ? "" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const ml = c => { if (!c) return ""; const [y, m] = c.split("-"); return `${MES[+m - 1]}/${y.slice(2)}`; };
const mlong = c => { if (!c) return ""; const [y, m] = c.split("-"); return `${MESL[+m - 1]} de ${y}`; };
const dt = d => d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR") : "—";
const parseNum = s => { s = String(s ?? "").trim().replace(/R\$|\s/g, ""); if (!s) return null; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = +s; return isFinite(n) ? n : NaN; };
const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0);
const toast = t => { const e = document.getElementById("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 3500); };
const safeName = n => norm(n).replace(/[^a-z0-9.\-]+/g, "-").slice(-80) || "arquivo";
const TIPOS = { contrato_social: "Contrato social", cnpj: "Cartão CNPJ", alvara: "Alvará", outro: "Outro documento" };
const ico = {
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
  doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>'
};
const svg = (k, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ico[k]}</svg>`;
const q = async p => { const { data, error } = await p; if (error) throw error; return data; };

/* ---------- estado ---------- */
const S = { me: null, parts: [], ext: [], clins: [], res: [], reps: [], docs: [], adm: null, mes: {}, filtroRep: "pend" };

/* ---------- gráficos ---------- */
const charts = new Map();
const ro = new ResizeObserver(es => es.forEach(e => { const f = charts.get(e.target); if (f) f(); }));
function chart(id, fn) { const el = document.getElementById(id); if (!el) return; charts.set(el, () => fn(el)); ro.observe(el); fn(el); }
function barsStack(s, cats, a, b, onTap, sel) { // a = pago (teal), b = pendente (claret)
  const W = s.clientWidth, H = s.clientHeight, pb = 24, pt = 20, n = cats.length || 1, bw = W / n;
  const mx = Math.max(1, ...cats.map((_, i) => (a[i] || 0) + (b[i] || 0))), y = v => (H - pt - pb) * v / mx;
  const sm = W < 520 && n > 8;
  s.innerHTML = `<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="var(--mut)"/>` + cats.map((c, i) => {
    const w = Math.min(34, bw * .62), x = i * bw + (bw - w) / 2, ha = y(a[i] || 0), hb = y(b[i] || 0), on = i === sel, base = H - pb;
    const lab = sm ? c.slice(0, 1) : c.split("/")[0];
    return `<g data-tap="${i}" style="cursor:pointer"><rect x="${i * bw}" y="0" width="${bw}" height="${H}" fill="transparent"/>` +
      (ha ? `<rect x="${x}" y="${base - ha}" width="${w}" height="${ha}" rx="3" fill="var(--pos)"/>` : "") +
      (hb ? `<rect x="${x}" y="${base - ha - hb - (ha ? 2 : 0)}" width="${w}" height="${hb}" rx="3" fill="var(--neg)"/>` : "") +
      (on ? `<text x="${i * bw + bw / 2}" y="${Math.max(12, base - ha - hb - 6)}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">${esc(brlK((a[i] || 0) + (b[i] || 0)).replace("R$" + NB, ""))}</text>` : "") +
      `<text x="${i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="12" fill="${on ? "var(--ink)" : "var(--mut)"}" font-weight="${on ? 800 : 400}">${esc(lab)}</text></g>`;
  }).join("");
  s.onclick = e => { const g = e.target.closest("[data-tap]"); if (g && onTap) onTap(+g.dataset.tap); };
}
function barsDiv(s, cats, vals, sel, onTap) {
  const W = s.clientWidth, H = s.clientHeight, pb = 24, pt = 20, n = cats.length || 1, bw = W / n;
  const mx = Math.max(0, ...vals.map(v => v || 0)), mn = Math.min(0, ...vals.map(v => v || 0)), sp = (mx - mn) || 1;
  const y = v => pt + (mx - v) / sp * (H - pt - pb), y0 = y(0);
  s.innerHTML = `<line x1="0" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--mut)"/>` + cats.map((c, i) => {
    const v = vals[i] || 0, w = Math.min(34, bw * .62), x = i * bw + (bw - w) / 2, top = Math.min(y(v), y0), h = Math.max(2, Math.abs(y(v) - y0)), on = i === sel;
    return `<g data-tap="${i}" style="cursor:pointer"><rect x="${i * bw}" y="0" width="${bw}" height="${H}" fill="transparent"/><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="${v >= 0 ? "var(--pos)" : "var(--neg)"}" opacity="${on ? 1 : .45}"/>` +
      (on ? `<text x="${i * bw + bw / 2}" y="${Math.max(12, Math.min(H - pb - 2, v >= 0 ? top - 6 : top + h + 14))}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">${esc(brlK(v).replace("R$" + NB, ""))}</text>` : "") +
      `<text x="${i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="12" fill="${on ? "var(--ink)" : "var(--mut)"}" font-weight="${on ? 800 : 400}">${esc(c.split("/")[0])}</text></g>`;
  }).join("");
  s.onclick = e => { const g = e.target.closest("[data-tap]"); if (g && onTap) onTap(+g.dataset.tap); };
}
function lines2(s, cats, a, b, sel) {
  const W = s.clientWidth, H = s.clientHeight, pb = 24, pt = 10, n = cats.length || 1, bw = W / n;
  const all = [...a, ...b].filter(v => v != null); if (!all.length) { s.innerHTML = ""; return; }
  let mx = Math.max(...all), mn = Math.min(...all); const pad = (mx - mn) * .15 || mx * .1 || 1; mx += pad; mn = Math.max(0, mn - pad);
  const x = i => bw * i + bw / 2, y = v => pt + (mx - v) / (mx - mn) * (H - pt - pb);
  const path = arr => arr.map((v, i) => v == null ? "" : `${i && arr[i - 1] != null ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const tk = [mn + (mx - mn) * .25, mn + (mx - mn) * .75];
  s.innerHTML = tk.map(t => `<line x1="0" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="4" y="${y(t) - 5}" font-size="12" fill="var(--mut)">${esc(brlK(t))}</text>`).join("") +
    (sel >= 0 ? `<line x1="${x(sel)}" x2="${x(sel)}" y1="${pt}" y2="${H - pb}" stroke="var(--mut)" stroke-dasharray="3 3"/>` : "") +
    `<path d="${path(a)}" fill="none" stroke="var(--pos)" stroke-width="2.5" stroke-linejoin="round"/><path d="${path(b)}" fill="none" stroke="var(--neg)" stroke-width="2.5" stroke-linejoin="round"/>` +
    (sel >= 0 ? [[a, "--pos"], [b, "--neg"]].map(([arr, c]) => arr[sel] == null ? "" : `<circle cx="${x(sel)}" cy="${y(arr[sel])}" r="5" fill="var(${c})" stroke="var(--card)" stroke-width="2"/>`).join("") : "") +
    cats.map((c, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="12" fill="${i === sel ? "var(--ink)" : "var(--mut)"}" font-weight="${i === sel ? 800 : 400}">${esc(c.split("/")[0])}</text>`).join("");
}

/* ---------- autenticação ---------- */
function viewLogin(modo = "entrar", msg = "") {
  charts.clear();
  const primeiro = modo === "primeiro";
  $app.innerHTML = `<div class="wrap"><div class="login">
    <svg class="mark" viewBox="0 0 56 56" aria-hidden="true"><rect width="56" height="56" rx="14" fill="var(--ink)"/><rect x="13" y="30" width="7" height="13" rx="2" fill="var(--pos)"/><rect x="24.5" y="22" width="7" height="21" rx="2" fill="var(--pos)"/><rect x="36" y="14" width="7" height="29" rx="2" fill="var(--bg)"/></svg>
    <h1>${primeiro ? "Primeiro acesso" : "Portal dos Sócios"}</h1>
    <p class="sub">${primeiro ? "Use o código de 6 dígitos que a gestão enviou para você e crie sua senha. Serve também para trocar uma senha esquecida." : "Resultados das clínicas, seus repasses e documentos."}</p>
    <form id="fLogin" class="card" novalidate>
      <div class="f"><label class="lb" for="em">E-mail</label><input id="em" type="email" autocomplete="username" required inputmode="email"></div>
      ${primeiro ? `<div class="f"><label class="lb" for="cod">Código de acesso</label><input id="cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></div>` : ""}
      <div class="f"><label class="lb" for="pw">${primeiro ? "Crie uma senha (mínimo 8 caracteres)" : "Senha"}</label><input id="pw" type="password" autocomplete="${primeiro ? "new-password" : "current-password"}" required minlength="${primeiro ? 8 : 1}"></div>
      <div class="err" id="err">${esc(msg)}</div>
      <button class="btn solid" style="width:100%" type="submit">${primeiro ? "Criar senha e entrar" : "Entrar"}</button>
    </form>
    <p style="text-align:center"><button class="link" id="alt">${primeiro ? "Já tenho senha" : "Primeiro acesso ou esqueci a senha"}</button></p>
  </div></div>`;
  document.getElementById("alt").onclick = () => viewLogin(primeiro ? "entrar" : "primeiro");
  document.getElementById("fLogin").onsubmit = async e => {
    e.preventDefault();
    const em = document.getElementById("em").value.trim(), pw = document.getElementById("pw").value, err = document.getElementById("err"), bt = e.target.querySelector("button[type=submit]");
    err.textContent = ""; bt.disabled = true;
    try {
      if (primeiro) {
        const cod = document.getElementById("cod").value.trim();
        if (pw.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
        const { data, error } = await sb.functions.invoke("soc-acesso", { body: { email: em, codigo: cod, senha: pw } });
        if (error) { let m = "Não foi possível concluir."; try { m = (await error.context.json()).erro || m; } catch (_) {} throw new Error(m); }
        if (!data?.ok) throw new Error(data?.erro || "Não foi possível concluir.");
      }
      const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
      if (error) throw new Error(error.message.includes("Invalid") ? "E-mail ou senha incorretos." : error.message);
      await boot();
    } catch (x) { err.textContent = x.message; bt.disabled = false; }
  };
}

/* ---------- carga de dados ---------- */
async function loadSocio() {
  const [parts, ext, clins, res, reps, docs] = await Promise.all([
    q(sb.rpc("soc_minhas_participacoes")), q(sb.rpc("soc_extrato")), q(sb.rpc("soc_clinicas")),
    q(sb.from("soc_resultados").select("*").order("competencia")),
    q(sb.from("soc_repasses").select("*").eq("socio_id", S.me.id).order("pago_em", { ascending: false })),
    q(sb.from("soc_documentos").select("*").order("enviado_em", { ascending: false }))
  ]);
  Object.assign(S, { parts, ext, clins, res, reps, docs });
}
async function loadAdmin() {
  const [socios, cotas, inds, extAll, repsAll] = await Promise.all([
    q(sb.from("soc_socios").select("id,nome,email,telefone,cpf,pix,admin,principal,ativo,user_id,convite_expira").order("nome")),
    q(sb.from("soc_cotas").select("*")), q(sb.from("soc_cotas_indiretas").select("*")),
    q(sb.rpc("soc_extrato", { p_socio: null, p_todos: true })),
    q(sb.from("soc_repasses").select("*").order("pago_em", { ascending: false }))
  ]);
  S.adm = { socios, cotas, inds, extAll, repsAll };
}
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return viewLogin();
  $app.innerHTML = `<div class="spin">Carregando…</div>`;
  try {
    S.me = await q(sb.rpc("soc_eu"));
    if (!S.me) { await sb.auth.signOut(); return viewLogin("entrar", "Este e-mail não está cadastrado como sócio. Fale com a gestão."); }
    await loadSocio();
    if (S.me.admin) await loadAdmin();
    route();
  } catch (x) { console.error(x); $app.innerHTML = `<div class="wrap"><div class="login"><h1>Algo deu errado</h1><p class="sub">${esc(x.message)}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div></div>`; }
}
async function refresh() { await loadSocio(); if (S.me.admin) await loadAdmin(); route(); }

/* ---------- moldura ---------- */
function frame(active, body, largo = false) {
  charts.clear();
  const nav = [["inicio", "home", "Início"], ["mes", "cal", "Mês atual"], ["repasses", "cash", "Repasses"], ["documentos", "doc", "Documentos"]];
  if (S.me.admin) nav.push(["admin", "gear", "Gestão"]);
  $app.innerHTML = `<div class="wrap${largo ? " largo" : ""}"><div class="top"><div class="who">${esc(S.me.nome)}<small>${esc(S.me.email)}</small></div>
    <button class="btn small" id="sair" aria-label="Sair">${svg("out")}Sair</button></div>${body}</div>
    <nav class="bottom" aria-label="Navegação">${nav.map(([h, i, t]) => `<a href="#${h}" ${active === h ? 'aria-current="page"' : ""}>${svg(i)}${t}</a>`).join("")}</nav>`;
  document.getElementById("sair").onclick = async () => { await sb.auth.signOut(); location.hash = ""; viewLogin(); };
}
function route() {
  const h = location.hash.slice(1) || "inicio";
  if (h.startsWith("clinica-")) return viewClinica(+h.slice(8));
  if (h.startsWith("admin")) return S.me.admin ? viewAdmin(h.slice(6) || "repasses") : viewInicio();
  if (h === "mes") return viewMes();
  if (h === "repasses") return viewRepasses();
  if (h === "documentos") return viewDocs();
  return viewInicio();
}
window.addEventListener("hashchange", () => { if (S.me) route(); });

/* ---------- agregações do sócio ---------- */
function meusMeses() {
  const by = new Map();
  for (const r of S.ext) { const m = by.get(r.competencia) || { c: r.competencia, devido: 0, pago: 0, saldo: 0 }; m.devido += +r.devido; m.pago += +r.pago; m.saldo += +r.saldo; by.set(r.competencia, m); }
  return [...by.values()].sort((a, b) => a.c < b.c ? -1 : 1);
}
function partsPorClinica() {
  const by = new Map();
  for (const p of S.parts) { const o = by.get(p.clinica_id) || { id: p.clinica_id, nome: p.clinica_nome, direta: null, inv: 0, ind: [] }; if (p.tipo === "direta") { o.direta = +p.percentual; o.inv += +p.valor_investido; } else o.ind.push(p); by.set(p.clinica_id, o); }
  return [...by.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}
const descPart = o => [o.direta != null ? `${pnum(o.direta)}% da clínica` : "", ...o.ind.map(i => `${pnum(i.percentual)}% da parte de ${i.origem_nome}`)].filter(Boolean).join(" + ");

/* ---------- Início ---------- */
function linhasGrade() {
  const ext = new Map(S.ext.map(r => [`${r.clinica_id}|${r.competencia}`, r]));
  const nome = id => (S.clins.find(c => c.id === id) || {}).nome || `Clínica ${id}`;
  const out = S.res.filter(r => r.faturamento != null || r.despesas != null).map(r => {
    const e = ext.get(`${r.clinica_id}|${r.competencia}`) || {}, dev = +e.devido || 0, pago = +e.pago || 0, saldo = +e.saldo || 0;
    return { c: r.competencia, cid: r.clinica_id, clinica: nome(r.clinica_id), ini: r.inicios, fat: r.faturamento == null ? null : +r.faturamento, desp: r.despesas == null ? null : +r.despesas,
      res: (+r.faturamento || 0) - (+r.despesas || 0), lucro: r.lucro_distribuido == null ? null : +r.lucro_distribuido, dev, pago, saldo,
      st: saldo > 0.009 ? (pago > 0.009 ? "parcial" : "pendente") : dev > 0.009 ? "pago" : "sem" };
  });
  for (const e of S.ext) if (!out.some(o => o.cid === e.clinica_id && o.c === e.competencia) && (+e.devido || +e.pago))
    out.push({ c: e.competencia, cid: e.clinica_id, clinica: e.clinica_nome, ini: null, fat: null, desp: null, res: null, lucro: e.lucro_clinica == null ? null : +e.lucro_clinica, dev: +e.devido, pago: +e.pago, saldo: +e.saldo, st: +e.saldo > 0.009 ? "pendente" : "pago" });
  return out;
}
function carregarFiltro() { try { return JSON.parse(localStorage.getItem("soc-filtro") || "null") || {}; } catch (_) { return {}; } }
function viewInicio() {
  const F = S.filtro || (S.filtro = Object.assign({ cid: "", de: "", ate: "", st: "", ord: "desc" }, carregarFiltro()));
  try { localStorage.setItem("soc-filtro", JSON.stringify(F)); } catch (_) {}
  const todas = linhasGrade();
  const meses = [...new Set(todas.map(r => r.c))].sort();
  let rows = todas.filter(r => (!F.cid || r.cid === +F.cid) && (!F.de || r.c >= F.de + "-01") && (!F.ate || r.c <= F.ate + "-01") &&
    (!F.st || (F.st === "pend" ? r.st === "pendente" || r.st === "parcial" : r.st === F.st)));
  rows.sort((a, b) => (a.c < b.c ? 1 : a.c > b.c ? -1 : a.clinica.localeCompare(b.clinica)) * (F.ord === "asc" ? -1 : 1));
  const partsF = S.parts.filter(p => p.tipo === "direta" && (!F.cid || p.clinica_id === +F.cid));
  const inv = sum(partsF, p => p.valor_investido), rec = sum(rows, r => r.pago), dev = sum(rows, r => r.dev), aRec = sum(rows.filter(r => r.saldo > 0.009), r => r.saldo);
  const nPend = rows.filter(r => r.saldo > 0.009).length, first = S.me.nome.split(" ")[0];
  const filtrado = F.cid || F.de || F.ate || F.st;
  const clinIds = [...new Set(todas.map(r => r.cid))];
  const opt = (v, t, s) => `<option value="${esc(v)}" ${String(s) === String(v) ? "selected" : ""}>${esc(t)}</option>`;
  const stTag = r => r.st === "pendente" ? `<span class="tag neg">falta ${brl0(r.saldo)}</span>` : r.st === "parcial" ? `<span class="tag neg">parcial · falta ${brl0(r.saldo)}</span>` : r.st === "pago" ? `<span class="tag pos">pago</span>` : `<span class="tag">sem lucro</span>`;
  const tot = { fat: sum(rows, r => r.fat), desp: sum(rows, r => r.desp), res: sum(rows, r => r.res), lucro: sum(rows, r => r.lucro), ini: sum(rows, r => r.ini) };
  frame("inicio", `
    <h1>${aRec > 0.009 ? `${esc(first)}, faltam ${brlK(aRec)} para você receber` : `${esc(first)}, seus repasses estão em dia`}</h1>
    <p class="sub">${filtrado ? "Números de acordo com os filtros abaixo." : `Você já recebeu ${brl(rec)}${inv ? `, ${pct(rec / inv)} do que investiu` : ""}.`}</p>
    <div class="actions" style="margin:0 0 14px"><a class="btn solid" href="#mes">${svg("cal")}Mês atual: metas e projeções</a></div>
    <div class="kpis">
      <div class="kpi"><div class="l">Investido</div><div class="v">${brlK(inv)}</div><span class="d mut">${F.cid ? esc((S.clins.find(c => c.id === +F.cid) || {}).nome || "") : `${clinIds.length} clínica${clinIds.length === 1 ? "" : "s"}`}</span></div>
      <div class="kpi"><div class="l">Recebido</div><div class="v">${brlK(rec)}</div><span class="d mut">de ${brlK(dev)} gerados</span></div>
      <div class="kpi"><div class="l">Retorno</div><div class="v">${inv ? pct(rec / inv) : "—"}</div><span class="d mut">sobre o investido</span></div>
      <div class="kpi ${aRec > 0.009 ? "alert" : ""}"><div class="l">A receber</div><div class="v">${brlK(aRec)}</div><span class="d">${nPend ? `${nPend} pendência${nPend === 1 ? "" : "s"}` : "nada pendente"}</span></div>
    </div>
    <div class="card" style="margin-top:14px">
      <form class="filtros" id="fil" aria-label="Filtros">
        <div class="f"><label class="lb" for="fc">Clínica</label><select id="fc" name="cid">${opt("", "Todas", F.cid)}${clinIds.map(id => opt(id, (S.clins.find(c => c.id === id) || {}).nome || id, F.cid)).join("")}</select></div>
        <div class="f"><label class="lb" for="fde">De</label><select id="fde" name="de">${opt("", "Início", F.de)}${meses.map(m => opt(m.slice(0, 7), ml(m), F.de)).join("")}</select></div>
        <div class="f"><label class="lb" for="fate">Até</label><select id="fate" name="ate">${opt("", "Mais recente", F.ate)}${meses.map(m => opt(m.slice(0, 7), ml(m), F.ate)).join("")}</select></div>
        <div class="f"><label class="lb" for="fst">Situação</label><select id="fst" name="st">${opt("", "Todas", F.st)}${opt("pend", "Falta receber", F.st)}${opt("pago", "Pagos", F.st)}${opt("sem", "Sem lucro", F.st)}</select></div>
        <div class="f"><label class="lb" for="ford">Ordem</label><select id="ford" name="ord">${opt("desc", "Mais recente primeiro", F.ord)}${opt("asc", "Mais antigo primeiro", F.ord)}</select></div>
        ${filtrado ? `<div class="f" style="align-self:end"><button type="button" class="btn" id="limpar">Limpar filtros</button></div>` : ""}
      </form>
      <p class="note" style="margin:6px 0 10px">${rows.length} ${rows.length === 1 ? "linha" : "linhas"} · toque no nome da clínica para ver os gráficos dela.</p>
      <div class="tbl"><table class="grade">
        <thead><tr><th>Mês</th><th>Clínica</th><th>Inícios</th><th>Faturamento</th><th>Despesas</th><th>Resultado</th><th>Lucro distribuído</th><th>Sua parte</th><th>Recebido</th><th>Situação</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="${r.saldo > 0.009 ? "pend" : ""}">
          <td data-l="Mês"><b>${ml(r.c)}</b></td><td data-l="Clínica"><a href="#clinica-${r.cid}">${esc(r.clinica)}</a></td>
          <td data-l="Inícios">${r.ini ?? "—"}</td><td data-l="Faturamento">${brl0(r.fat)}</td><td data-l="Despesas">${brl0(r.desp)}</td>
          <td data-l="Resultado" class="${r.res < 0 ? "bad" : ""}">${r.res == null ? "—" : brl0(r.res)}</td><td data-l="Lucro distribuído">${brl0(r.lucro)}</td>
          <td data-l="Sua parte"><b>${brl0(r.dev)}</b></td><td data-l="Recebido">${brl0(r.pago)}</td><td data-l="Situação">${stTag(r)}</td></tr>`).join("") || `<tr><td colspan="10" class="empty">Nada encontrado com esses filtros.</td></tr>`}</tbody>
        ${rows.length > 1 ? `<tfoot><tr><td data-l="">Total</td><td data-l=""></td><td data-l="Inícios">${tot.ini}</td><td data-l="Faturamento">${brl0(tot.fat)}</td><td data-l="Despesas">${brl0(tot.desp)}</td><td data-l="Resultado" class="${tot.res < 0 ? "bad" : ""}">${brl0(tot.res)}</td><td data-l="Lucro distribuído">${brl0(tot.lucro)}</td><td data-l="Sua parte">${brl0(dev)}</td><td data-l="Recebido">${brl0(rec)}</td><td data-l="Falta receber" class="${aRec > 0.009 ? "bad" : ""}">${aRec > 0.009 ? brl0(aRec) : "—"}</td></tr></tfoot>` : ""}
      </table></div>
    </div>`, true);
  const f = document.getElementById("fil");
  f.onchange = () => { const d = Object.fromEntries(new FormData(f)); if (d.de && d.ate && d.de > d.ate) [d.de, d.ate] = [d.ate, d.de]; S.filtro = d; viewInicio(); };
  const lp = document.getElementById("limpar"); if (lp) lp.onclick = () => { S.filtro = { cid: "", de: "", ate: "", st: "", ord: F.ord }; viewInicio(); };
}

/* ---------- Clínica ---------- */
function viewClinica(id) {
  const c = S.clins.find(x => x.id === id);
  if (!c) { location.hash = "inicio"; return; }
  const rs = S.res.filter(r => r.clinica_id === id && (r.faturamento != null || r.despesas != null)).sort((a, b) => a.competencia < b.competencia ? -1 : 1);
  const k = `c${id}`; let sel = S.mes[k] ?? rs.length - 1;
  const o = rs[sel] || {}, p = rs[sel - 1] || {};
  const res = r => r.faturamento != null || r.despesas != null ? (+r.faturamento || 0) - (+r.despesas || 0) : null;
  const ro_ = res(o), marg = o.faturamento ? ro_ / o.faturamento : null;
  const dl = (v, pv, up = true) => { if (v == null || pv == null || !pv) return `<span class="d mut">sem comparação</span>`; const ch = (v - pv) / Math.abs(pv); return `<span class="d ${(ch > 0) === up ? "good" : "bad"}">${ch > 0 ? "▲" : "▼"} ${pct(Math.abs(ch))} vs mês ant.</span>`; };
  const meu = S.ext.filter(r => r.clinica_id === id).sort((a, b) => a.competencia < b.competencia ? 1 : -1);
  const pc = partsPorClinica().find(x => x.id === id);
  const alerts = rs.filter(r => +r.despesas === 0 && +r.faturamento > 0).map(r => `Despesas de ${ml(r.competencia)} estão zeradas; confira com a gestão.`);
  frame("inicio", `
    <p style="margin:6px 0 0"><a href="#inicio" class="link" style="text-decoration:none">← Início</a></p>
    <h1>${o.competencia ? `${esc(c.nome)}: ${ro_ >= 0 ? "resultado de" : "prejuízo de"} ${brlK(Math.abs(ro_))} em ${MESL[+o.competencia.split("-")[1] - 1].toLowerCase()}` : esc(c.nome)}</h1>
    <p class="sub">${pc ? esc(descPart(pc)) : ""}${marg != null ? ` · margem de ${pct(marg)}` : ""}</p>
    <div class="scroll" id="mesesC">${rs.map((r, i) => `<button class="chip" data-i="${i}" aria-pressed="${i === sel}">${ml(r.competencia)}</button>`).join("")}</div>
    ${rs.length ? `<div class="kpis" style="margin-top:10px">
      <div class="kpi"><div class="l">Faturamento</div><div class="v">${brlK(+o.faturamento)}</div>${dl(+o.faturamento, p.faturamento != null ? +p.faturamento : null)}</div>
      <div class="kpi"><div class="l">Despesas</div><div class="v">${brlK(+o.despesas)}</div>${dl(+o.despesas, p.despesas != null ? +p.despesas : null, false)}</div>
      <div class="kpi"><div class="l">Resultado</div><div class="v ${ro_ < 0 ? "bad" : ""}">${brlK(ro_)}</div>${dl(ro_, res(p))}</div>
      <div class="kpi"><div class="l">Inícios</div><div class="v">${o.inicios ?? "—"}</div>${dl(o.inicios, p.inicios)}</div></div>` : `<p class="empty">Ainda não há resultados lançados para esta clínica.</p>`}
    ${alerts.length ? `<div class="banner">${svg("warn")}<span>${alerts.map(esc).join("<br>")}</span></div>` : ""}
    <div class="grid two">
      <div class="card"><h2>Resultado mês a mês</h2><p class="note">Faturamento menos despesas. Toque numa barra para escolher o mês.</p><div class="fig"><svg id="cRes" role="img" aria-label="Resultado mensal"></svg></div></div>
      <div class="card"><h2>Faturamento e despesas</h2><div class="legend"><span class="key"><i style="background:var(--pos)"></i>Faturamento ${brlK(+o.faturamento)}</span><span class="key"><i style="background:var(--neg)"></i>Despesas ${brlK(+o.despesas)}</span></div><div class="fig"><svg id="cFD" role="img" aria-label="Faturamento e despesas"></svg></div></div>
      <div class="card span"><h2>Sua parte nesta clínica</h2><p class="note">Lucro distribuído pela clínica e quanto cabe a você.</p>
        <div class="tbl"><table><thead><tr><th>Mês</th><th>Lucro distribuído</th><th>Sua parte</th><th>Recebido</th><th>Situação</th></tr></thead><tbody>
        ${meu.map(r => `<tr><td>${ml(r.competencia)}</td><td>${brl(r.lucro_clinica)}</td><td>${brl(+r.devido)}</td><td>${brl(+r.pago)}</td><td>${+r.saldo > 0.009 ? `<span class="tag neg">falta ${brl(+r.saldo)}</span>` : +r.devido > 0 ? `<span class="tag pos">pago</span>` : `<span class="tag">sem lucro</span>`}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">Sem lançamentos.</td></tr>`}
        </tbody></table></div></div>
    </div>`);
  document.getElementById("mesesC").onclick = e => { const b = e.target.closest("[data-i]"); if (b) { S.mes[k] = +b.dataset.i; viewClinica(id); } };
  const cats = rs.map(r => ml(r.competencia));
  chart("cRes", s => barsDiv(s, cats, rs.map(res), sel, i => { S.mes[k] = i; viewClinica(id); }));
  chart("cFD", s => lines2(s, cats, rs.map(r => r.faturamento == null ? null : +r.faturamento), rs.map(r => r.despesas == null ? null : +r.despesas), sel));
  const ch = document.querySelector('#mesesC [aria-pressed="true"]'); if (ch) ch.scrollIntoView({ block: "nearest", inline: "nearest" });
}

/* ---------- arquivos ---------- */
async function abrirArquivo(path) {
  const w = window.open("", "_blank");
  try { const { data, error } = await sb.storage.from("socios").createSignedUrl(path, 300); if (error) throw error; if (w) w.location = data.signedUrl; else location.href = data.signedUrl; }
  catch (x) { if (w) w.close(); toast("Não foi possível abrir o arquivo."); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-arq]"); if (b) { e.preventDefault(); abrirArquivo(b.dataset.arq); } });
async function subir(prefix, file) {
  const path = `${prefix}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await sb.storage.from("socios").upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error; return path;
}

/* ---------- Repasses (sócio) ---------- */
function viewRepasses() {
  const f = S.filtroRep;
  const rows = [...S.ext].filter(r => +r.devido > 0.009 || +r.pago > 0.009).sort((a, b) => a.competencia < b.competencia ? 1 : a.competencia > b.competencia ? -1 : a.clinica_nome.localeCompare(b.clinica_nome));
  const vis = f === "pend" ? rows.filter(r => +r.saldo > 0.009) : rows;
  const aRec = sum(rows.filter(r => +r.saldo > 0.009), r => r.saldo);
  frame("repasses", `
    <h1>${aRec > 0.009 ? `Faltam ${brlK(aRec)} em repasses` : "Repasses em dia"}</h1>
    <p class="sub">O que cabe a você em cada mês, o que já foi pago e os comprovantes.</p>
    <div class="scroll" id="fr"><button class="chip" data-f="pend" aria-pressed="${f === "pend"}">Pendentes</button><button class="chip" data-f="todos" aria-pressed="${f === "todos"}">Todos</button></div>
    <div class="card" style="margin-top:10px">${vis.length ? vis.map(r => {
      const comp = S.reps.filter(p => p.clinica_id === r.clinica_id && p.competencia === r.competencia);
      const st = +r.saldo > 0.009 ? (+r.pago > 0 ? `<span class="tag neg">parcial: falta ${brl(+r.saldo)}</span>` : `<span class="tag neg">falta ${brl(+r.saldo)}</span>`) : `<span class="tag pos">pago</span>`;
      return `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(r.clinica_nome)} · ${ml(r.competencia)}</b><small>Sua parte ${brl(+r.devido)}${+r.pago ? ` · recebido ${brl(+r.pago)}` : ""}</small></div><div class="r">${st}</div>
        ${comp.length ? `<div style="width:100%;display:flex;flex-wrap:wrap;gap:6px">${comp.map(p => p.comprovante_path ? `<button class="btn small" data-arq="${esc(p.comprovante_path)}">${svg("doc")}Comprovante ${dt(p.pago_em)}</button>` : `<span class="tag">pago em ${dt(p.pago_em)} · sem comprovante</span>`).join("")}</div>` : ""}</div>`;
    }).join("") : `<p class="empty">${f === "pend" ? "Nenhum repasse pendente." : "Nenhum repasse ainda."}</p>`}</div>`);
  document.getElementById("fr").onclick = e => { const b = e.target.closest("[data-f]"); if (b) { S.filtroRep = b.dataset.f; viewRepasses(); } };
}

/* ---------- Documentos (sócio) ---------- */
function venc(d) { if (!d) return ""; const dias = Math.round((new Date(d + "T12:00:00") - new Date()) / 864e5); if (dias < 0) return `<span class="tag neg">vencido em ${dt(d)}</span>`; if (dias <= 30) return `<span class="tag neg">vence em ${dias} dia${dias === 1 ? "" : "s"}</span>`; return `<span class="tag">válido até ${dt(d)}</span>`; }
function listaDocs(docs, admin = false) {
  const by = new Map(); for (const d of docs) { const a = by.get(d.clinica_id) || []; a.push(d); by.set(d.clinica_id, a); }
  const nome = id => (S.clins.find(c => c.id === id) || {}).nome || `Clínica ${id}`;
  return [...by.entries()].sort((a, b) => nome(a[0]).localeCompare(nome(b[0]))).map(([cid, ds]) => `<div class="card" style="margin-top:12px"><h2>${esc(nome(cid))}</h2>
    ${ds.sort((a, b) => a.tipo.localeCompare(b.tipo)).map(d => `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(d.titulo)}</b><small>${esc(TIPOS[d.tipo] || d.tipo)} · enviado em ${dt(d.enviado_em.slice(0, 10))}</small></div>
      <div class="r" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${venc(d.validade)}<button class="btn small" data-arq="${esc(d.arquivo_path)}">Abrir</button>${admin ? `<button class="btn small danger" data-deldoc="${esc(d.id)}">Excluir</button>` : ""}</div></div>`).join("")}</div>`).join("") || `<p class="empty">Nenhum documento disponível ainda.</p>`;
}
function viewDocs() {
  const venc_ = S.docs.filter(d => d.validade && new Date(d.validade + "T12:00:00") < new Date(Date.now() + 30 * 864e5));
  frame("documentos", `<h1>Central de documentos</h1><p class="sub">Contrato social, cartão CNPJ, alvarás e outros documentos das suas clínicas.</p>
    ${venc_.length ? `<div class="banner">${svg("warn")}<span><b>${venc_.length} documento${venc_.length === 1 ? "" : "s"}</b> vencido${venc_.length === 1 ? "" : "s"} ou vencendo em 30 dias.</span></div>` : ""}
    ${listaDocs(S.docs)}`);
}

/* ---------- modal ---------- */
function modal(title, html, onMount) {
  const m = document.createElement("div"); m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
  m.innerHTML = `<div><div class="mhead"><h2>${esc(title)}</h2><button class="x" aria-label="Fechar">×</button></div>${html}</div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); document.removeEventListener("keydown", k); };
  const k = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", k);
  m.querySelector(".x").onclick = close; m.onclick = e => { if (e.target === m) close(); };
  onMount && onMount(m, close);
  const f = m.querySelector("input,select,textarea"); if (f) setTimeout(() => f.focus(), 50);
  return close;
}
const clinOpts = (sel, todas = false) => (todas ? `<option value="">Todas as clínicas</option>` : `<option value="">Escolha…</option>`) + S.clins.map(c => `<option value="${c.id}" ${+sel === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("");

/* ---------- Gestão ---------- */
function viewAdmin(tab) {
  const tabs = [["repasses", "Repasses"], ["mes", "Mês atual"], ["socios", "Sócios"], ["resultados", "Resultados"], ["documentos", "Documentos"], ["clinicas", "Clínicas"]];
  const body = { repasses: admRepasses, mes: admMes, socios: admSocios, resultados: admResultados, documentos: admDocs, clinicas: admClinicas }[tab] || admRepasses;
  frame("admin", `<h1>Gestão</h1><div class="scroll tabs">${tabs.map(([k, t]) => `<a class="chip" href="#admin-${k}" aria-pressed="${k === tab}" style="display:inline-flex;align-items:center;text-decoration:none">${t}</a>`).join("")}</div><div id="admBody"></div>`);
  body(document.getElementById("admBody"));
}

/* Repasses (gestão): débitos em vermelho e registro de pagamentos com comprovante */
function admRepasses(el) {
  const A = S.adm, pend = A.extAll.filter(r => +r.saldo > 0.009).sort((a, b) => a.competencia < b.competencia ? -1 : 1);
  const tot = sum(pend, r => r.saldo);
  const porSocio = new Map(); for (const r of pend) porSocio.set(r.socio_nome, (porSocio.get(r.socio_nome) || 0) + +r.saldo);
  const nomeS = id => (A.socios.find(s => s.id === id) || {}).nome || "—", nomeC = id => (S.clins.find(c => c.id === id) || {}).nome || id;
  el.innerHTML = `<div class="kpis" style="margin-top:12px"><div class="kpi ${tot > 0.009 ? "alert" : ""}"><div class="l">Total a repassar</div><div class="v">${brlK(tot)}</div><span class="d">${pend.length} pendência${pend.length === 1 ? "" : "s"}</span></div>
    ${[...porSocio.entries()].slice(0, 3).map(([n, v]) => `<div class="kpi alert"><div class="l">${esc(n)}</div><div class="v">${brlK(v)}</div></div>`).join("")}</div>
    <div class="grid two"><div class="card"><h2>Falta enviar</h2><p class="note">Toque em Registrar quando fizer o repasse e anexe o comprovante.</p>
      ${pend.length ? pend.map((r, i) => `<div class="li"><div class="t"><b class="bad">${esc(r.socio_nome)}</b><small>${esc(r.clinica_nome)} · ${ml(r.competencia)} · devido ${brl(+r.devido)}${+r.pago ? `, pago ${brl(+r.pago)}` : ""}</small></div><div class="r" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="bad" style="font-weight:800">${brl(+r.saldo)}</span><button class="btn small solid" data-reg="${i}">Registrar</button></div></div>`).join("") : `<p class="empty">Nenhum repasse pendente.</p>`}
      <div class="actions"><button class="btn" id="novoRep">Registrar outro repasse</button></div></div>
    <div class="card"><h2>Repasses feitos</h2><p class="note">Os mais recentes primeiro.</p>
      ${A.repsAll.slice(0, 60).map(p => `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(nomeS(p.socio_id))} · ${brl(+p.valor)}</b><small>${esc(nomeC(p.clinica_id))} · ${ml(p.competencia)} · pago em ${dt(p.pago_em)}${p.obs ? " · " + esc(p.obs) : ""}</small></div>
        <div class="r" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${p.comprovante_path ? `<button class="btn small" data-arq="${esc(p.comprovante_path)}">Comprovante</button>` : `<button class="btn small danger" data-anexar="${esc(p.id)}">Anexar comprovante</button>`}<button class="btn small" data-delrep="${esc(p.id)}" aria-label="Excluir repasse">Excluir</button></div></div>`).join("") || `<p class="empty">Nenhum repasse registrado.</p>`}</div></div>`;
  el.onclick = async e => {
    const t = e.target.closest("[data-reg],#novoRep,[data-anexar],[data-delrep]"); if (!t) return;
    if (t.dataset.reg != null) { const r = pend[+t.dataset.reg]; formRepasse({ socio_id: r.socio_id, clinica_id: r.clinica_id, competencia: r.competencia, valor: +r.saldo }); }
    else if (t.id === "novoRep") formRepasse({});
    else if (t.dataset.anexar) anexarComp(t.dataset.anexar);
    else if (t.dataset.delrep) confirmar("Excluir este repasse? O valor volta a aparecer como pendente.", async () => { const p = A.repsAll.find(x => x.id === t.dataset.delrep); await q(sb.from("soc_repasses").delete().eq("id", p.id)); if (p.comprovante_path) await sb.storage.from("socios").remove([p.comprovante_path]); toast("Repasse excluído"); await refresh(); });
  };
}
function confirmar(txt, fn) {
  modal("Confirmar", `<p>${esc(txt)}</p><div class="actions"><button class="btn danger" id="ok">Confirmar</button><button class="btn" id="no">Cancelar</button></div>`, (m, close) => {
    m.querySelector("#no").onclick = close; m.querySelector("#ok").onclick = async () => { try { await fn(); close(); } catch (x) { toast(x.message); } };
  });
}
function formRepasse(v) {
  const A = S.adm, hoje = new Date().toISOString().slice(0, 10);
  modal("Registrar repasse", `<form id="fr" novalidate>
    <div class="f"><label class="lb" for="rs">Sócio</label><select id="rs" required><option value="">Escolha…</option>${A.socios.filter(s => s.ativo).map(s => `<option value="${s.id}" ${s.id === v.socio_id ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}</select></div>
    <div class="f"><label class="lb" for="rc">Clínica</label><select id="rc" required>${clinOpts(v.clinica_id)}</select></div>
    <div class="row2"><div class="f"><label class="lb" for="rm">Mês de referência</label><input id="rm" type="month" required value="${v.competencia ? v.competencia.slice(0, 7) : hoje.slice(0, 7)}"></div>
    <div class="f"><label class="lb" for="rd">Data do pagamento</label><input id="rd" type="date" required value="${hoje}"></div></div>
    <div class="f"><label class="lb" for="rv">Valor pago (R$)</label><input id="rv" inputmode="decimal" required value="${v.valor ? v.valor.toFixed(2).replace(".", ",") : ""}"></div>
    <div class="f"><label class="lb" for="rf">Comprovante (PDF ou foto)</label><input id="rf" type="file" accept="application/pdf,image/*"></div>
    <div class="f"><label class="lb" for="ro">Observação (opcional)</label><input id="ro"></div>
    <div class="err" id="re"></div><button class="btn solid" type="submit" style="width:100%">Salvar repasse</button></form>`, (m, close) => {
    m.querySelector("#fr").onsubmit = async e => {
      e.preventDefault(); const er = m.querySelector("#re"), bt = m.querySelector("[type=submit]"); er.textContent = "";
      const socio_id = m.querySelector("#rs").value, clinica_id = +m.querySelector("#rc").value, mes = m.querySelector("#rm").value, valor = parseNum(m.querySelector("#rv").value), file = m.querySelector("#rf").files[0];
      if (!socio_id || !clinica_id || !mes || !(valor > 0)) { er.textContent = "Preencha sócio, clínica, mês e um valor maior que zero."; return; }
      bt.disabled = true;
      try {
        const comprovante_path = file ? await subir(`comp/${socio_id}`, file) : null;
        await q(sb.from("soc_repasses").insert({ socio_id, clinica_id, competencia: mes + "-01", valor, pago_em: m.querySelector("#rd").value, comprovante_path, obs: m.querySelector("#ro").value.trim() || null }));
        close(); toast(file ? "Repasse e comprovante salvos" : "Repasse salvo (sem comprovante)"); await refresh();
      } catch (x) { er.textContent = x.message; bt.disabled = false; }
    };
  });
}
function anexarComp(id) {
  const p = S.adm.repsAll.find(x => x.id === id);
  modal("Anexar comprovante", `<form id="fa"><div class="f"><label class="lb" for="af">Arquivo (PDF ou foto)</label><input id="af" type="file" accept="application/pdf,image/*" required></div><div class="err" id="ae"></div><button class="btn solid" type="submit" style="width:100%">Enviar</button></form>`, (m, close) => {
    m.querySelector("#fa").onsubmit = async e => { e.preventDefault(); const f = m.querySelector("#af").files[0], er = m.querySelector("#ae"); if (!f) { er.textContent = "Escolha o arquivo."; return; }
      try { const path = await subir(`comp/${p.socio_id}`, f); await q(sb.from("soc_repasses").update({ comprovante_path: path }).eq("id", id)); close(); toast("Comprovante anexado"); await refresh(); } catch (x) { er.textContent = x.message; } };
  });
}

/* Sócios: cadastro, cotas por clínica, % do administrador, código de acesso */
function admSocios(el) {
  const A = S.adm, principal = A.socios.find(s => s.principal);
  el.innerHTML = `<div class="actions" style="margin:12px 0"><button class="btn solid" id="novoS">Novo sócio</button></div>
    ${principal ? "" : `<div class="banner">${svg("warn")}<span>Nenhum sócio está marcado como <b>administrador principal</b>. Marque quem é para que a opção "% do administrador" funcione.</span></div>`}
    <div class="card" style="margin-top:12px">${A.socios.map(s => {
      const cs = A.cotas.filter(c => c.socio_id === s.id && c.ativo), ind = A.inds.find(i => i.beneficiario_id === s.id && i.ativo);
      return `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(s.nome)}</b>${s.principal ? ` <span class="tag">administrador principal</span>` : s.admin ? ` <span class="tag">gestão</span>` : ""}${!s.ativo ? ` <span class="tag neg">inativo</span>` : ""}
        <small>${esc(s.email)} · ${s.user_id ? "acesso ativo" : s.convite_expira && new Date(s.convite_expira) > new Date() ? "código enviado" : "sem acesso ainda"}</small>
        <small>${cs.map(c => `${esc((S.clins.find(x => x.id === c.clinica_id) || {}).nome || c.clinica_id)} ${pnum(c.percentual)}%${+c.valor_investido ? ` (${brlK(+c.valor_investido)})` : ""}`).join(" · ") || "sem cotas"}${ind ? ` · ${pnum(ind.percentual)}% do administrador` : ""}</small></div>
        <div class="r"><button class="btn small" data-ed="${esc(s.id)}">Editar</button></div></div>`; }).join("") || `<p class="empty">Nenhum sócio cadastrado.</p>`}</div>`;
  el.onclick = e => { const t = e.target.closest("#novoS,[data-ed]"); if (!t) return; formSocio(t.dataset.ed ? A.socios.find(s => s.id === t.dataset.ed) : null); };
}
function formSocio(s) {
  const A = S.adm, principal = A.socios.find(x => x.principal);
  const cotas = s ? A.cotas.filter(c => c.socio_id === s.id) : [];
  const ind = s ? A.inds.find(i => i.beneficiario_id === s.id && principal && i.origem_socio_id === principal.id) : null;
  const linha = c => `<div class="cota"><div class="cl"><label class="lb">Clínica</label><select data-k="clinica">${clinOpts(c.clinica_id)}</select></div>
    <div><label class="lb">% da clínica</label><input data-k="pct" inputmode="decimal" value="${c.percentual != null ? pnum(c.percentual) : ""}" placeholder="10"></div>
    <div><label class="lb">Valor investido (R$)</label><input data-k="inv" inputmode="decimal" value="${c.valor_investido ? Number(c.valor_investido).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""}" placeholder="0,00"></div>
    <button type="button" class="btn small danger" data-rm>Remover</button><input type="hidden" data-k="id" value="${esc(c.id || "")}"><input type="hidden" data-k="ini" value="${esc(c.data_inicio || "")}"></div>`;
  const souPrincipal = s && s.principal;
  modal(s ? "Editar sócio" : "Novo sócio", `<form id="fs" novalidate>
    <div class="f"><label class="lb" for="sn">Nome</label><input id="sn" required value="${esc(s?.nome)}"></div>
    <div class="f"><label class="lb" for="se">E-mail (usado no login)</label><input id="se" type="email" required value="${esc(s?.email)}" inputmode="email"></div>
    <div class="row2"><div class="f"><label class="lb" for="st">Telefone</label><input id="st" inputmode="tel" value="${esc(s?.telefone)}"></div><div class="f"><label class="lb" for="sc">CPF</label><input id="sc" inputmode="numeric" value="${esc(s?.cpf)}"></div></div>
    <div class="f"><label class="lb" for="sp">Chave PIX para repasses</label><input id="sp" value="${esc(s?.pix)}"></div>
    <h3 style="margin:14px 0 6px">Cotas nas clínicas</h3><p class="note">Percentual do lucro distribuído e quanto o sócio investiu em cada cota.</p>
    <div id="cotas">${cotas.map(linha).join("")}</div><button type="button" class="btn small" id="addC">+ Adicionar clínica</button>
    <h3 style="margin:18px 0 6px">% do administrador</h3>
    ${souPrincipal ? `<p class="note">Este é o administrador principal.</p>` : principal ? `<label class="check"><input type="checkbox" id="temInd" ${ind ? "checked" : ""}>Tem algum % do administrador (${esc(principal.nome)})?</label>
      <div class="f" id="indBox" ${ind ? "" : "hidden"}><label class="lb" for="indP">Quanto (% sobre o que ${esc(principal.nome.split(" ")[0])} recebe)</label><input id="indP" inputmode="decimal" value="${ind ? pnum(ind.percentual) : ""}" placeholder="20"></div>` : `<p class="note">Marque primeiro um sócio como administrador principal.</p>`}
    <h3 style="margin:18px 0 6px">Acesso</h3>
    <label class="check"><input type="checkbox" id="sa" ${s?.admin ? "checked" : ""}>Faz parte da gestão (acessa a área Gestão)</label>
    <label class="check"><input type="checkbox" id="spp" ${s?.principal ? "checked" : ""}>É o administrador principal</label>
    ${s ? `<label class="check"><input type="checkbox" id="sat" ${s.ativo ? "checked" : ""}>Ativo</label>` : ""}
    <div class="err" id="ee"></div>
    <div class="actions"><button class="btn solid" type="submit">Salvar</button>${s ? `<button type="button" class="btn" id="conv">Gerar código de acesso</button>` : ""}</div></form>`, (m, close) => {
    const box = m.querySelector("#cotas");
    m.querySelector("#addC").onclick = () => box.insertAdjacentHTML("beforeend", linha({}));
    box.onclick = e => { if (e.target.closest("[data-rm]")) e.target.closest(".cota").remove(); };
    const ti = m.querySelector("#temInd"); if (ti) ti.onchange = () => { m.querySelector("#indBox").hidden = !ti.checked; };
    const cv = m.querySelector("#conv"); if (cv) cv.onclick = () => { close(); gerarConvite(s); };
    m.querySelector("#fs").onsubmit = async e => {
      e.preventDefault(); const er = m.querySelector("#ee"), bt = m.querySelector("[type=submit]"); er.textContent = "";
      const nome = m.querySelector("#sn").value.trim(), email = m.querySelector("#se").value.trim().toLowerCase();
      if (!nome || !/^\S+@\S+\.\S+$/.test(email)) { er.textContent = "Informe nome e um e-mail válido."; return; }
      const linhas = [...box.querySelectorAll(".cota")].map(r => { const g = k => r.querySelector(`[data-k=${k}]`).value; return { id: g("id") || null, clinica_id: +g("clinica"), percentual: parseNum(g("pct")), valor_investido: parseNum(g("inv")) ?? 0, data_inicio: g("ini") || null }; });
      for (const l of linhas) if (!l.clinica_id || !(l.percentual >= 0 && l.percentual <= 100) || isNaN(l.valor_investido)) { er.textContent = "Confira as cotas: escolha a clínica, um % entre 0 e 100 e um valor investido válido."; return; }
      if (new Set(linhas.map(l => l.clinica_id)).size !== linhas.length) { er.textContent = "Há a mesma clínica repetida nas cotas."; return; }
      let indP = null; if (ti && ti.checked) { indP = parseNum(m.querySelector("#indP").value); if (!(indP > 0 && indP <= 100)) { er.textContent = "Informe o % do administrador (entre 0 e 100)."; return; } }
      const virouPrincipal = m.querySelector("#spp").checked;
      bt.disabled = true;
      try {
        const dados = { nome, email, telefone: m.querySelector("#st").value.trim() || null, cpf: m.querySelector("#sc").value.trim() || null, pix: m.querySelector("#sp").value.trim() || null, admin: m.querySelector("#sa").checked || virouPrincipal, principal: virouPrincipal };
        if (s) dados.ativo = m.querySelector("#sat").checked;
        if (virouPrincipal && principal && (!s || principal.id !== s.id)) await q(sb.from("soc_socios").update({ principal: false }).eq("id", principal.id));
        const sid = s ? (await q(sb.from("soc_socios").update(dados).eq("id", s.id).select("id").single())).id : (await q(sb.from("soc_socios").insert(dados).select("id").single())).id;
        const manter = linhas.filter(l => l.id).map(l => l.id), antigas = cotas.filter(c => !manter.includes(c.id)).map(c => c.id);
        if (antigas.length) await q(sb.from("soc_cotas").delete().in("id", antigas));
        for (const l of linhas) { const row = { socio_id: sid, clinica_id: l.clinica_id, percentual: l.percentual, valor_investido: l.valor_investido, data_inicio: l.data_inicio, ativo: true }; if (l.id) await q(sb.from("soc_cotas").update(row).eq("id", l.id)); else await q(sb.from("soc_cotas").upsert(row, { onConflict: "socio_id,clinica_id" })); }
        if (principal && !virouPrincipal) {
          if (indP != null) { if (ind) await q(sb.from("soc_cotas_indiretas").update({ percentual: indP, ativo: true }).eq("id", ind.id)); else await q(sb.from("soc_cotas_indiretas").insert({ beneficiario_id: sid, origem_socio_id: principal.id, percentual: indP })); }
          else if (ind) await q(sb.from("soc_cotas_indiretas").delete().eq("id", ind.id));
        }
        close(); toast("Sócio salvo"); await refresh();
        if (!s) { const novo = S.adm.socios.find(x => x.id === sid); if (novo && novo.id !== S.me.id) gerarConvite(novo); }
      } catch (x) { er.textContent = x.message.includes("duplicate") ? "Já existe um sócio com este e-mail." : x.message; bt.disabled = false; }
    };
  });
}
async function gerarConvite(s) {
  try {
    const c = await q(sb.rpc("soc_gerar_convite", { p_socio: s.id }));
    const msg = `Olá, ${s.nome.split(" ")[0]}! Seu acesso ao Portal dos Sócios está pronto.\n1. Abra ${CFG.siteUrl}\n2. Toque em "Primeiro acesso ou esqueci a senha"\n3. Use o e-mail ${s.email} e o código ${c}\nO código vale por 7 dias.`;
    modal("Código de acesso", `<p class="note">Envie para ${esc(s.nome)} pelo WhatsApp. Vale por 7 dias e permite criar (ou trocar) a senha.</p><div class="code">${esc(c)}</div>
      <div class="f"><label class="lb" for="cm">Mensagem pronta</label><textarea id="cm" rows="6" readonly>${esc(msg)}</textarea></div>
      <div class="actions"><button class="btn solid" id="cp">Copiar mensagem</button></div>`, m => {
      m.querySelector("#cp").onclick = async () => { try { await navigator.clipboard.writeText(msg); toast("Mensagem copiada"); } catch (_) { m.querySelector("#cm").select(); toast("Selecione e copie o texto"); } };
    });
    await loadAdmin();
  } catch (x) { toast(x.message); }
}

/* Resultados: importar a planilha diária (.xlsx) ou editar um mês */
function parseBlocos(rows) {
  const keyOf = s => s.startsWith("inicio") ? "inicios" : s.startsWith("faturamento") ? "faturamento" : s.startsWith("despesa") ? "despesas" : s.startsWith("lucro") ? "lucro" : null;
  const label = v => { if (v instanceof Date) return [v.getFullYear(), v.getMonth() + 1]; const t = norm(v).match(/^([a-z]{3})[a-z]*[\/\-\s.]*(\d{2,4})$/); if (!t) return null; const m = MES.indexOf(t[1]); if (m < 0) return null; let y = +t[2]; if (y < 100) y += 2000; return [y, m + 1]; };
  const out = []; let cur = null, hdr = false;
  for (const r of rows) {
    if (!r) continue;
    if (norm(r[1]) === "valor investido" && r[0] != null) { cur = { nome: String(r[0]).trim(), meses: [], v: {} }; out.push(cur); hdr = true; continue; }
    if (cur && hdr) { cur.meses = r.slice(1).map(label); hdr = false; continue; }
    if (cur && r[0] != null) { const k = keyOf(norm(r[0])); if (k) cur.v[k] = cur.meses.map((_, i) => { const x = r[i + 1]; return typeof x === "number" && isFinite(x) ? x : null; }); }
  }
  return out.map(b => ({ nome: b.nome, linhas: b.meses.map((m, i) => m && { competencia: `${m[0]}-${String(m[1]).padStart(2, "0")}-01`, inicios: b.v.inicios?.[i] ?? null, faturamento: b.v.faturamento?.[i] ?? null, despesas: b.v.despesas?.[i] ?? null, lucro_distribuido: b.v.lucro?.[i] ?? null }).filter(l => l && (l.faturamento != null || l.despesas != null)) }));
}
function acharClinica(nome) {
  const n = norm(nome), tok = n.split(/\s+/);
  return (S.clins.find(c => norm(c.nome) === n) || S.clins.find(c => norm(c.nome).includes(n) || n.includes(norm(c.nome))) ||
    S.clins.find(c => { const cn = norm(c.nome).split(/\s+/); return tok.length === cn.length && tok.every((t, i) => cn[i].startsWith(t)); }) || {}).id || "";
}
function admResultados(el) {
  const porC = new Map(); for (const r of S.res) { const a = porC.get(r.clinica_id) || []; a.push(r); porC.set(r.clinica_id, a); }
  el.innerHTML = `<div class="card" style="margin-top:12px"><h2>Importar planilha</h2><p class="note">Envie o .xlsx no formato de acompanhamento (blocos por clínica com Início, Faturamento, Despesas e Lucro). Os meses já lançados são atualizados.</p>
      <label class="btn solid" for="xf">${svg("doc")}Escolher planilha</label><input id="xf" type="file" accept=".xlsx,.xls" style="position:absolute;width:1px;height:1px;opacity:0"><div id="prev"></div></div>
    <div class="actions" style="margin-top:12px"><button class="btn" id="novoMes">Lançar ou corrigir um mês</button></div>
    ${[...porC.entries()].map(([cid, rs]) => `<div class="card" style="margin-top:12px"><h2>${esc((S.clins.find(c => c.id === cid) || {}).nome || cid)}</h2><div class="tbl"><table><thead><tr><th>Mês</th><th>Inícios</th><th>Faturamento</th><th>Despesas</th><th>Resultado</th><th>Lucro distribuído</th><th></th></tr></thead><tbody>
      ${rs.sort((a, b) => a.competencia < b.competencia ? 1 : -1).map(r => { const res = (+r.faturamento || 0) - (+r.despesas || 0); return `<tr><td>${ml(r.competencia)}</td><td>${r.inicios ?? "—"}</td><td>${brl(r.faturamento == null ? null : +r.faturamento)}</td><td>${+r.despesas === 0 && +r.faturamento > 0 ? `<span class="tag neg">R$ 0,00</span>` : brl(r.despesas == null ? null : +r.despesas)}</td><td class="${res < 0 ? "bad" : ""}">${brl(res)}</td><td>${brl(r.lucro_distribuido == null ? null : +r.lucro_distribuido)}</td><td><button class="btn small" data-er="${cid}|${r.competencia}">Editar</button></td></tr>`; }).join("")}
      </tbody></table></div></div>`).join("")}`;
  el.querySelector("#novoMes").onclick = () => formMes({});
  el.onclick = e => { const b = e.target.closest("[data-er]"); if (b) { const [cid, c] = b.dataset.er.split("|"); formMes(S.res.find(r => r.clinica_id === +cid && r.competencia === c)); } };
  el.querySelector("#xf").onchange = async e => {
    const f = e.target.files[0]; if (!f) return; const pv = el.querySelector("#prev");
    try {
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array", cellDates: true });
      const rows = wb.SheetNames.flatMap(n => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }).concat([[null]]));
      const blocos = parseBlocos(rows).filter(b => b.linhas.length);
      if (!blocos.length) throw new Error("Não encontrei blocos de clínica (linha com “Valor Investido”).");
      pv.innerHTML = `<h3 style="margin:16px 0 6px">Confira antes de salvar</h3>${blocos.map((b, i) => `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(b.nome)}</b><small>${b.linhas.length} meses (${ml(b.linhas[0].competencia)} a ${ml(b.linhas[b.linhas.length - 1].competencia)}) · faturamento total ${brlK(sum(b.linhas, l => l.faturamento))}</small></div><div class="r" style="min-width:180px"><select data-map="${i}" aria-label="Clínica correspondente a ${esc(b.nome)}">${clinOpts(acharClinica(b.nome)).replace("Escolha…", "Não importar")}</select></div></div>`).join("")}
        <div class="actions"><button class="btn solid" id="salvarImp">Salvar ${sum(blocos, b => b.linhas.length)} meses</button></div>`;
      pv.querySelector("#salvarImp").onclick = async ev => {
        ev.target.disabled = true;
        try {
          const ups = []; pv.querySelectorAll("[data-map]").forEach(s => { const cid = +s.value; if (cid) blocos[+s.dataset.map].linhas.forEach(l => ups.push({ ...l, clinica_id: cid, atualizado_em: new Date().toISOString() })); });
          if (!ups.length) throw new Error("Nenhuma clínica escolhida.");
          await q(sb.from("soc_resultados").upsert(ups, { onConflict: "clinica_id,competencia" }));
          await q(sb.from("soc_clinicas_info").upsert([...new Set(ups.map(u => u.clinica_id))].map(id => ({ clinica_id: id })), { onConflict: "clinica_id", ignoreDuplicates: true }));
          toast(`${ups.length} meses salvos`); await refresh();
        } catch (x) { toast(x.message); ev.target.disabled = false; }
      };
    } catch (x) { pv.innerHTML = `<p class="err">${esc(x.message)}</p>`; }
    e.target.value = "";
  };
}
function formMes(r) {
  const v = x => x == null ? "" : Number(x).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  modal(r.competencia ? "Corrigir mês" : "Lançar mês", `<form id="fm" novalidate>
    <div class="row2"><div class="f"><label class="lb" for="mc">Clínica</label><select id="mc" ${r.competencia ? "disabled" : ""}>${clinOpts(r.clinica_id)}</select></div><div class="f"><label class="lb" for="mm">Mês</label><input id="mm" type="month" value="${r.competencia ? r.competencia.slice(0, 7) : ""}" ${r.competencia ? "disabled" : ""}></div></div>
    <div class="row2"><div class="f"><label class="lb" for="mf">Faturamento (R$)</label><input id="mf" inputmode="decimal" value="${v(r.faturamento)}"></div><div class="f"><label class="lb" for="md">Despesas (R$)</label><input id="md" inputmode="decimal" value="${v(r.despesas)}"></div></div>
    <div class="row2"><div class="f"><label class="lb" for="mi">Inícios</label><input id="mi" inputmode="numeric" value="${r.inicios ?? ""}"></div><div class="f"><label class="lb" for="ml">Lucro distribuído (R$)</label><input id="ml" inputmode="decimal" value="${v(r.lucro_distribuido)}"></div></div>
    <p class="note">O lucro distribuído é a base do repasse de cada sócio.</p><div class="err" id="me"></div><button class="btn solid" type="submit" style="width:100%">Salvar</button></form>`, (m, close) => {
    m.querySelector("#fm").onsubmit = async e => {
      e.preventDefault(); const er = m.querySelector("#me");
      const cid = +m.querySelector("#mc").value, mes = m.querySelector("#mm").value, row = { clinica_id: cid, competencia: mes + "-01", faturamento: parseNum(m.querySelector("#mf").value), despesas: parseNum(m.querySelector("#md").value), inicios: parseNum(m.querySelector("#mi").value), lucro_distribuido: parseNum(m.querySelector("#ml").value), atualizado_em: new Date().toISOString() };
      if (!cid || !mes) { er.textContent = "Escolha clínica e mês."; return; }
      if ([row.faturamento, row.despesas, row.inicios, row.lucro_distribuido].some(x => Number.isNaN(x))) { er.textContent = "Há um número inválido."; return; }
      try { await q(sb.from("soc_resultados").upsert(row, { onConflict: "clinica_id,competencia" })); close(); toast("Mês salvo"); await refresh(); } catch (x) { er.textContent = x.message; }
    };
  });
}

/* Documentos (gestão) */
function admDocs(el) {
  el.innerHTML = `<div class="card" style="margin-top:12px"><h2>Enviar documento</h2><form id="fd" novalidate>
    <div class="row2"><div class="f"><label class="lb" for="dc">Clínica</label><select id="dc" required>${clinOpts()}</select></div><div class="f"><label class="lb" for="dtp">Tipo</label><select id="dtp">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div></div>
    <div class="row2"><div class="f"><label class="lb" for="dti">Título</label><input id="dti" placeholder="Ex.: Alvará sanitário 2026"></div><div class="f"><label class="lb" for="dv">Validade (se tiver)</label><input id="dv" type="date"></div></div>
    <div class="f"><label class="lb" for="dfi">Arquivo (PDF ou imagem, até 20 MB)</label><input id="dfi" type="file" accept="application/pdf,image/*" required></div>
    <div class="err" id="de"></div><button class="btn solid" type="submit">Enviar</button></form></div>${listaDocs(S.docs, true)}`;
  el.querySelector("#fd").onsubmit = async e => {
    e.preventDefault(); const er = el.querySelector("#de"), bt = e.target.querySelector("[type=submit]"), f = el.querySelector("#dfi").files[0], cid = +el.querySelector("#dc").value, tipo = el.querySelector("#dtp").value;
    if (!cid || !f) { er.textContent = "Escolha a clínica e o arquivo."; return; }
    bt.disabled = true; er.textContent = "";
    try { const path = await subir(`doc/${cid}`, f); await q(sb.from("soc_documentos").insert({ clinica_id: cid, tipo, titulo: el.querySelector("#dti").value.trim() || TIPOS[tipo], validade: el.querySelector("#dv").value || null, arquivo_path: path, tamanho: f.size })); toast("Documento enviado"); await refresh(); }
    catch (x) { er.textContent = x.message; bt.disabled = false; }
  };
  el.onclick = e => { const b = e.target.closest("[data-deldoc]"); if (!b) return; const d = S.docs.find(x => x.id === b.dataset.deldoc); confirmar(`Excluir "${d.titulo}"? O arquivo será apagado.`, async () => { await q(sb.from("soc_documentos").delete().eq("id", d.id)); await sb.storage.from("socios").remove([d.arquivo_path]); toast("Documento excluído"); await refresh(); }); };
}

/* Clínicas: dados cadastrais usados no portal */
function admClinicas(el) {
  el.innerHTML = `<p class="note" style="margin-top:12px">As clínicas vêm do sistema principal. Aqui ficam os dados cadastrais que os sócios veem.</p><div class="card">${S.clins.map(c => `<div class="li"><div class="t"><b>${esc(c.nome)}</b><small>${esc([c.razao_social, c.cnpj && "CNPJ " + c.cnpj, c.cidade && `${c.cidade}${c.uf ? "/" + c.uf : ""}`].filter(Boolean).join(" · ") || "sem dados cadastrais")}</small></div><div class="r"><button class="btn small" data-ec="${c.id}">Editar</button></div></div>`).join("")}</div>`;
  el.onclick = e => { const b = e.target.closest("[data-ec]"); if (!b) return; const c = S.clins.find(x => x.id === +b.dataset.ec);
    modal(c.nome, `<form id="fc" novalidate><div class="f"><label class="lb" for="cr">Razão social</label><input id="cr" value="${esc(c.razao_social)}"></div><div class="f"><label class="lb" for="cn">CNPJ</label><input id="cn" inputmode="numeric" value="${esc(c.cnpj)}"></div><div class="f"><label class="lb" for="ce">Endereço</label><input id="ce" value="${esc(c.endereco)}"></div><div class="err" id="cee"></div><button class="btn solid" type="submit" style="width:100%">Salvar</button></form>`, (m, close) => {
      m.querySelector("#fc").onsubmit = async ev => { ev.preventDefault(); try { await q(sb.from("soc_clinicas_info").upsert({ clinica_id: c.id, razao_social: m.querySelector("#cr").value.trim() || null, cnpj: m.querySelector("#cn").value.trim() || null, endereco: m.querySelector("#ce").value.trim() || null, atualizado_em: new Date().toISOString() }, { onConflict: "clinica_id" })); close(); toast("Clínica salva"); await refresh(); } catch (x) { m.querySelector("#cee").textContent = x.message; } };
    }); };
}


/* ---------- Mês atual: metas, diário e projeções ---------- */
const hojeComp = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
async function loadMes(comp) {
  const fim = new Date(Date.UTC(+comp.slice(0, 4), +comp.slice(5, 7), 1)).toISOString().slice(0, 10);
  const [metas, dias, comps] = await Promise.all([
    q(sb.from("soc_mes").select("*").eq("competencia", comp)),
    q(sb.from("soc_mes_dias").select("clinica_id,data,recebido,venda,cobranca").gte("data", comp).lt("data", fim).order("data")),
    q(sb.from("soc_mes").select("competencia").order("competencia", { ascending: false }))
  ]);
  return { comp, metas, dias, comps: [...new Set(comps.map(c => c.competencia))] };
}
function calcMes(m, dias, comp) {
  const du = Caixa.diasUteis(comp), total = m.dias_uteis_total || du.length;
  const real = dias.reduce((t, d) => t + +d.recebido, 0), ult = dias.filter(d => +d.recebido > 0).map(d => d.data).pop() || null;
  let passados = ult ? du.filter(d => d <= ult).length : 0;
  const metaFat = m.meta_faturamento == null ? null : +m.meta_faturamento;
  const venda = m.venda_realizada == null ? null : +m.venda_realizada;
  const cob = m.cobranca_realizada != null ? +m.cobranca_realizada : venda != null ? real - venda : null;
  // Mesma regra do painel do Leo: atualização feita antes das 18h deixa o dia de hoje incompleto; a média usa até ontem.
  let hojeR = 0, hojeV = 0, hojeC = 0;
  if (m.orto_importado_em && ult) {
    const imp = new Date(m.orto_importado_em), dImp = imp.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }), hImp = +imp.toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false });
    if (ult === dImp && hImp < 18 && du.includes(ult) && passados > 1) { const d = dias.find(x => x.data === ult) || {}; hojeR = +d.recebido || 0; hojeV = +d.venda || 0; hojeC = +d.cobranca || 0; passados -= 1; }
  }
  const faltam = Math.max(0, total - passados);
  const proj = (v, hoje) => v == null || !passados ? null : (v - hoje) / passados * total;
  const projVenda = proj(venda, hojeV), projCob = proj(cob, hojeC);
  const projFat = projVenda != null && projCob != null ? projVenda + projCob : proj(real, hojeR);
  const metaCob0 = m.meta_cobranca == null ? null : +m.meta_cobranca;
  const metaVenda = m.meta_venda != null ? +m.meta_venda : metaFat != null && metaCob0 != null ? metaFat - metaCob0 : null;
  const metaCob = metaCob0 != null ? metaCob0 : metaFat != null && metaVenda != null ? metaFat - metaVenda : null;
  const metaDesp = m.meta_despesa == null ? null : +m.meta_despesa, despReal = m.despesa_real == null ? null : +m.despesa_real;
  const despProj = metaDesp == null && despReal == null ? null : Math.max(metaDesp || 0, despReal || 0);
  return { total, passados, faltam, ult, real, projFat, metaFat, metaVenda, venda, projVenda, metaCob, cob, projCob,
    metaDesp, despReal, despProj, resPrev: metaFat != null && metaDesp != null ? metaFat - metaDesp : null,
    resProj: projFat != null && despProj != null ? projFat - despProj : null,
    precisaDia: metaFat != null && faltam ? Math.max(0, metaFat - real) / faltam : null, mediaDia: passados ? (real - hojeR) / passados : null };
}
function somaCalc(cs) {
  const nn = (k, f = () => true) => { const v = cs.filter(f).map(c => c[k]).filter(x => x != null); return v.length ? v.reduce((t, x) => t + x, 0) : null; };
  const todos = k => cs.some(c => c[k] == null) ? null : cs.reduce((t, c) => t + c[k], 0);
  const o = {}; for (const k of ["real", "projFat", "metaFat", "metaDesp", "despReal", "despProj", "resProj", "precisaDia", "mediaDia"]) o[k] = nn(k);
  for (const k of ["metaVenda", "venda", "projVenda", "metaCob", "cob", "projCob"]) o[k] = todos(k);
  const comMeta = c => c.metaFat != null; o.projFatMeta = nn("projFat", comMeta); o.realMeta = nn("real", comMeta); o.resPrev = nn("resPrev");
  o.parcial = cs.some(c => c.metaFat == null);
  o.total = Math.max(...cs.map(c => c.total)); o.passados = Math.max(...cs.map(c => c.passados)); o.faltam = Math.min(...cs.map(c => c.faltam));
  o.ult = cs.map(c => c.ult).filter(Boolean).sort().pop() || null; return o;
}
const pm = (v, meta) => v == null || !meta ? null : v / meta;
async function viewMes() {
  frame("mes", `<div class="spin">Carregando o mês…</div>`, true);
  let D;
  try {
    D = await loadMes(S.mesComp || hojeComp());
    if (!D.metas.length && D.comps.length && !S.mesComp) { S.mesComp = D.comps[0]; D = await loadMes(S.mesComp); }
  } catch (x) { frame("mes", `<h1>Mês atual</h1><p class="sub">${esc(x.message)}</p>`, true); return; }
  const comp = D.comp, nomeC = id => (S.clins.find(c => c.id === id) || {}).nome || `Clínica ${id}`;
  const cl = D.metas.map(m => ({ id: m.clinica_id, nome: nomeC(m.clinica_id), m, c: calcMes(m, D.dias.filter(d => d.clinica_id === m.clinica_id), comp), dias: D.dias.filter(d => d.clinica_id === m.clinica_id) })).sort((a, b) => a.nome.localeCompare(b.nome));
  if (!cl.length) { frame("mes", `<h1>${esc(mlong(comp))}</h1><p class="sub">A gestão ainda não carregou os números deste mês.</p>${D.comps.length ? `<div class="scroll">${D.comps.map(c => `<button class="chip" data-comp="${c}">${ml(c)}</button>`).join("")}</div>` : ""}`, true); bindMes(); return; }
  const selId = cl.some(x => x.id === S.mesClin) ? S.mesClin : (cl.length === 1 ? cl[0].id : 0);
  const sel = selId ? cl.find(x => x.id === selId) : null;
  const c = sel ? sel.c : somaCalc(cl.map(x => x.c));
  const nome = sel ? sel.nome : "Todas as suas clínicas";
  const pf = sel ? pm(c.projFat, c.metaFat) : pm(c.projFatMeta, c.metaFat), bate = pf != null && pf >= 1;
  const mesNome = MESL[+comp.slice(5, 7) - 1];
  const pctTag = p => p == null ? "" : `<span class="d ${p >= 1 ? "good" : "bad"}">${pct(p, 0)} da meta</span>`;
  const linhaVC = (rot, meta, real, proj) => `<tr><td>${rot}</td><td>${brl0(meta)}</td><td>${brl0(real)}</td><td>${brl0(proj)}</td><td>${pm(proj, meta) == null ? "—" : `<span class="${pm(proj, meta) >= 1 ? "good" : "bad"}" style="font-weight:700">${pct(pm(proj, meta), 1)}</span>`}</td></tr>`;
  const avisos = cl.filter(x => (!selId || x.id === selId) && x.c.metaFat == null).map(x => `${x.nome}: meta de faturamento não preenchida na planilha (aba Previsao-Real).`);
  cl.filter(x => (!selId || x.id === selId) && x.c.metaDesp != null && x.c.despReal != null && x.c.metaDesp < x.c.despReal * 0.6).forEach(x => avisos.push(`${x.nome}: a previsão de despesas do mês (${brl0(x.c.metaDesp)}) parece incompleta perto do que já foi pago (${brl0(x.c.despReal)}); a projeção usa o valor pago.`));
  if (cl.some(x => (!selId || x.id === selId) && x.c.venda == null)) avisos.push("Venda do mês ainda não chegou do painel Dashboards Orthopride.");
  frame("mes", `
    <div class="scroll" style="margin-top:8px">${D.comps.slice(0, 12).map(x => `<button class="chip" data-comp="${x}" aria-pressed="${x === comp}">${ml(x)}</button>`).join("")}</div>
    <h1>${c.projFat != null ? (!sel && c.parcial && pf != null ? `${mesNome}: clínicas com meta projetam ${pct(pf, 0)} da meta` : `${mesNome}: projeção de ${brlK(c.projFat)}${pf != null ? `, ${pct(pf, 0)} da meta` : ""}`) : `${mesNome}: ${brlK(c.real)} até agora`}</h1>
    <p class="sub">${esc(nome)} · ${c.ult ? `lançado até ${dt(c.ult)} · ${c.passados} de ${c.total} dias úteis, faltam ${c.faltam}` : "sem lançamentos ainda"}</p>
    ${cl.length > 1 ? `<div class="scroll" id="mesCl"><button class="chip" data-cl="0" aria-pressed="${!selId}">Todas</button>${cl.map(x => `<button class="chip" data-cl="${x.id}" aria-pressed="${x.id === selId}">${esc(x.nome)}</button>`).join("")}</div>` : ""}
    <div class="kpis" style="margin-top:10px">
      <div class="kpi"><div class="l">Meta de faturamento</div><div class="v">${brlK(c.metaFat)}</div><span class="d mut">${c.parcial ? "só clínicas com meta" : "definida no início do mês"}</span></div>
      <div class="kpi"><div class="l">Faturado até agora</div><div class="v">${brlK(c.real)}</div>${pctTag(sel ? pm(c.real, c.metaFat) : pm(c.realMeta, c.metaFat))}</div>
      <div class="kpi ${pf != null && !bate ? "alert" : ""}"><div class="l">Projeção do mês</div><div class="v ${bate ? "good" : ""}">${brlK(c.projFat)}</div>${pctTag(pf)}</div>
      <div class="kpi"><div class="l">Média por dia útil</div><div class="v">${brlK(c.mediaDia)}</div><span class="d mut">${c.precisaDia != null ? `precisa de ${brlK(c.precisaDia)}/dia` : "—"}</span></div>
    </div>
    ${avisos.length ? `<div class="banner">${svg("warn")}<span>${avisos.map(esc).join("<br>")}</span></div>` : ""}
    <div class="grid two">
      <div class="card"><h2>Faturamento diário</h2><p class="note">Venda + cobrança de cada dia${sel ? "" : ", somando as clínicas"}. A linha tracejada é a média por dia útil que bate a meta.</p>
        <div class="fig"><svg id="cDia" role="img" aria-label="Faturamento diário"></svg></div></div>
      <div class="card"><h2>Venda, cobrança e total</h2><p class="note">Venda e cobrança vêm do painel Dashboards Orthopride. Projeção = média por dia útil × dias úteis do mês (segunda a sábado, sem feriados).</p>
        <div class="tbl"><table><thead><tr><th></th><th>Meta</th><th>Até agora</th><th>Projeção</th><th>% meta</th></tr></thead><tbody>
          ${linhaVC("Venda", c.metaVenda, c.venda, c.projVenda)}${linhaVC("Cobrança", c.metaCob, c.cob, c.projCob)}${linhaVC("<b>Valor total</b>", c.metaFat, c.real, c.projFat)}
        </tbody></table></div></div>
      <div class="card span"><h2>Meta inicial × projeção</h2><p class="note">A despesa projetada é a prevista no início do mês (aba Previsão de Despesas) ou a já paga, se for maior.</p>
        <div class="tbl"><table><thead><tr><th></th><th>Meta inicial</th><th>Projeção</th><th>Diferença</th></tr></thead><tbody>
          <tr><td>Faturamento</td><td>${brl0(c.metaFat)}</td><td>${brl0(c.projFat)}</td><td class="${c.projFat != null && c.metaFat != null && c.projFat < c.metaFat ? "bad" : "good"}">${c.projFat != null && c.metaFat != null ? brl0(c.projFat - c.metaFat) : "—"}</td></tr>
          <tr><td>Despesas <small class="mut">(pagas até agora: ${brl0(c.despReal)})</small></td><td>${brl0(c.metaDesp)}</td><td>${brl0(c.despProj)}</td><td class="${c.despProj > c.metaDesp ? "bad" : ""}">${c.despProj != null && c.metaDesp != null ? brl0(c.despProj - c.metaDesp) : "—"}</td></tr>
          <tr style="font-weight:800"><td>Resultado</td><td class="${c.resPrev < 0 ? "bad" : ""}">${brl0(c.resPrev)}</td><td class="${c.resProj < 0 ? "bad" : "good"}">${brl0(c.resProj)}</td><td>${c.resProj != null && c.resPrev != null ? brl0(c.resProj - c.resPrev) : "—"}</td></tr>
        </tbody></table></div></div>
      ${!sel && cl.length > 1 ? `<div class="card span"><h2>Por clínica</h2><div class="tbl"><table class="grade"><thead><tr><th>Clínica</th><th>Meta</th><th>Até agora</th><th>Projeção</th><th>% meta</th><th>Despesa prevista</th><th>Resultado projetado</th></tr></thead><tbody>
        ${cl.map(x => `<tr><td data-l="Clínica"><a href="#mes" data-cl="${x.id}">${esc(x.nome)}</a></td><td data-l="Meta">${brl0(x.c.metaFat)}</td><td data-l="Até agora">${brl0(x.c.real)}</td><td data-l="Projeção">${brl0(x.c.projFat)}</td><td data-l="% meta">${pm(x.c.projFat, x.c.metaFat) == null ? "—" : `<span class="${pm(x.c.projFat, x.c.metaFat) >= 1 ? "good" : "bad"}" style="font-weight:700">${pct(pm(x.c.projFat, x.c.metaFat), 0)}</span>`}</td><td data-l="Despesa prevista">${brl0(x.c.metaDesp)}</td><td data-l="Resultado projetado" class="${x.c.resProj < 0 ? "bad" : ""}">${brl0(x.c.resProj)}</td></tr>`).join("")}
      </tbody></table></div></div>` : ""}
    </div>
    <p class="note" style="margin-top:14px">${(() => { const o = cl.map(x => x.m.orto_importado_em).filter(Boolean).sort().pop(); return o ? `Venda e cobrança: painel Dashboards Orthopride, importação de ${new Date(o).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}. Despesas: planilhas de caixa.` : "Dados das planilhas de caixa."; })()}</p>`, true);
  const nDias = new Date(Date.UTC(+comp.slice(0, 4), +comp.slice(5, 7), 0)).getUTCDate();
  const porDia = Array.from({ length: nDias }, (_, i) => { const d = `${comp.slice(0, 8)}${String(i + 1).padStart(2, "0")}`; return (sel ? sel.dias : D.dias).filter(x => x.data === d).reduce((t, x) => t + +x.recebido, 0); });
  const ref = c.metaFat != null && c.total ? c.metaFat / c.total : null;
  chart("cDia", s => barsDia(s, porDia, ref, c.ult ? +c.ult.slice(8) : 0));
  bindMes();
}
function barsDia(s, vals, ref, ult) {
  const W = s.clientWidth, H = s.clientHeight, pb = 22, pt = 14, n = vals.length, bw = W / n;
  const mx = Math.max(1, ref || 0, ...vals) * 1.08, y = v => H - pb - (H - pb - pt) * v / mx;
  s.innerHTML = `<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="var(--mut)"/>` +
    vals.map((v, i) => { const w = Math.max(2, Math.min(18, bw * .66)), x = i * bw + (bw - w) / 2, h = (H - pb) - y(v);
      return `<g><title>${i + 1}: ${brl(v)}</title>${v > 0 ? `<rect x="${x}" y="${y(v)}" width="${w}" height="${h}" rx="2" fill="var(--pos)" opacity="${ref && v < ref ? .55 : 1}"/>` : ""}${(i + 1) % (W < 520 ? 5 : 2) === 1 || i + 1 === ult ? `<text x="${i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="${i + 1 === ult ? "var(--ink)" : "var(--mut)"}" font-weight="${i + 1 === ult ? 800 : 400}">${i + 1}</text>` : ""}</g>`; }).join("") +
    (ref ? `<line x1="0" x2="${W}" y1="${y(ref)}" y2="${y(ref)}" stroke="var(--neg)" stroke-dasharray="5 4"/><text x="${W - 4}" y="${y(ref) - 5}" text-anchor="end" font-size="12" fill="var(--neg)" font-weight="600">${esc(brlK(ref))}/dia</text>` : "");
}
function bindMes() {
  document.querySelectorAll("[data-comp]").forEach(b => b.onclick = () => { S.mesComp = b.dataset.comp; viewMes(); });
  document.querySelectorAll("[data-cl]").forEach(b => b.onclick = e => { e.preventDefault(); S.mesClin = +b.dataset.cl; viewMes(); });
}

/* Gestão: subir as planilhas de caixa e lançar venda/metas */
const SIGLAS = { ipt: "ipatinga", gvs: "governador valadares", dvl: "divinopolis", div: "divinopolis", jua: "janauba", jau: "janauba", vic: "vicosa", vcs: "vicosa", orthopride: "vicosa" };
function clinicaPorArquivo(nomeArq) {
  const n = norm(nomeArq); for (const [k, v] of Object.entries(SIGLAS)) if (n.split(/[^a-z]+/).includes(k) || n.includes(k)) { const c = S.clins.find(x => norm(x.nome) === v); if (c) return c.id; }
  return "";
}
async function admMes(el) {
  const comp = S.admMesComp || hojeComp();
  el.innerHTML = `<div class="spin">Carregando…</div>`;
  const D = await loadMes(comp);
  const nomeC = id => (S.clins.find(c => c.id === id) || {}).nome || id;
  el.innerHTML = `<div class="card" style="margin-top:12px"><h2>Subir planilhas de caixa</h2>
      <p class="note">Escolha um ou mais arquivos de caixa (IPT 2026, GVS 2026, DVL 26, JUA 2026, CAIXA mensal…). O portal lê a aba <b>Previsao-Real</b> (meta e realizado de despesas). Venda, cobrança e faturamento diário chegam sozinhos do painel Dashboards Orthopride; o caixa só preenche o faturamento se o painel não tiver o mês.</p>
      <label class="btn solid" for="cxf">${svg("doc")}Escolher arquivos</label><input id="cxf" type="file" accept=".xlsx,.xls" multiple style="position:absolute;width:1px;height:1px;opacity:0"><div id="cxPrev"></div></div>
    <div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><h2>${esc(mlong(comp))}</h2>
      <div class="f" style="margin:0"><label class="lb" for="amc" style="font-weight:500">Mês</label><input id="amc" type="month" value="${comp.slice(0, 7)}"></div></div>
      ${D.metas.length ? D.metas.map(m => { const c = calcMes(m, D.dias.filter(d => d.clinica_id === m.clinica_id), comp);
        return `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(nomeC(m.clinica_id))}</b><small>Meta ${brl0(c.metaFat)} · até ${c.ult ? dt(c.ult) : "—"}: ${brl0(c.real)} · projeção ${brl0(c.projFat)} · despesa prevista ${brl0(c.metaDesp)}</small>
          <small>Venda: meta ${brl0(c.metaVenda)} · realizada ${c.venda == null ? `<span class="bad">não informada</span>` : brl0(c.venda)} · Cobrança: meta ${brl0(c.metaCob)} · realizada ${brl0(c.cob)}${m.orto_importado_em ? ` · painel ${new Date(m.orto_importado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : ""}</small></div>
          <div class="r"><button class="btn small" data-edm="${m.clinica_id}">Editar metas e venda</button></div></div>`; }).join("") : `<p class="empty">Nenhuma clínica carregada neste mês.</p>`}</div>`;
  el.querySelector("#amc").onchange = e => { if (e.target.value) { S.admMesComp = e.target.value + "-01"; admMes(el); } };
  el.onclick = e => { const b = e.target.closest("[data-edm]"); if (b) formMetas(D.metas.find(m => m.clinica_id === +b.dataset.edm), comp, () => admMes(el)); };
  el.querySelector("#cxf").onchange = async e => {
    const files = [...e.target.files], pv = el.querySelector("#cxPrev"); if (!files.length) return;
    pv.innerHTML = `<p class="note">Lendo ${files.length} arquivo${files.length > 1 ? "s" : ""}…</p>`;
    const lidos = [];
    for (const f of files) { try { const wb = XLSX.read(await f.arrayBuffer(), { type: "array" }); lidos.push({ f, r: Caixa.lerCaixa(XLSX, wb), cid: clinicaPorArquivo(f.name) }); } catch (x) { lidos.push({ f, erro: x.message }); } }
    const m0 = comp;
    pv.innerHTML = `<h3 style="margin:16px 0 6px">Confira antes de salvar (${esc(mlong(m0))})</h3>` + lidos.map((l, i) => {
      if (l.erro) return `<div class="li"><div class="t"><b>${esc(l.f.name)}</b><small class="bad">Não consegui ler: ${esc(l.erro)}</small></div></div>`;
      const mm = l.r.meses[m0] || {}, dd = l.r.dias.filter(d => d.data.startsWith(m0.slice(0, 7))), ult = dd.filter(d => d.recebido > 0).pop();
      return `<div class="li" style="flex-wrap:wrap"><div class="t"><b>${esc(l.f.name)}</b><small>Faturado ${brl0(mm.fat_caixa)} até ${ult ? dt(ult.data) : "—"} · meta ${brl0(mm.fat_prev)} · despesa prevista ${brl0(mm.desp_prev)} · paga ${brl0(mm.desp_real)}</small>${l.r.avisos.length ? `<small class="bad">${l.r.avisos.map(esc).join(" ")}</small>` : ""}</div>
        <div class="r" style="min-width:190px"><select data-cxi="${i}" aria-label="Clínica de ${esc(l.f.name)}">${clinOpts(l.cid).replace("Escolha…", "Não importar")}</select></div></div>`;
    }).join("") + `<label class="check"><input type="checkbox" id="cxRes">Atualizar também faturamento e despesas dos meses anteriores em Resultados</label>
      <div class="actions"><button class="btn solid" id="cxSalvar">Salvar</button></div>`;
    pv.querySelector("#cxSalvar").onclick = async ev => {
      ev.target.disabled = true;
      try {
        let n = 0;
        for (const s of pv.querySelectorAll("[data-cxi]")) {
          const cid = +s.value, l = lidos[+s.dataset.cxi]; if (!cid || !l.r) continue;
          const mm = l.r.meses[m0] || {}, dd = l.r.dias.filter(d => d.data.startsWith(m0.slice(0, 7)));
          const atual = D.metas.find(x => x.clinica_id === cid), temPainel = !!(atual && atual.orto_importado_em);
          const row = { clinica_id: cid, competencia: m0, meta_despesa: mm.desp_prev ?? null, despesa_real: mm.desp_real ?? null, atualizado_em: new Date().toISOString() };
          if (!temPainel || atual.meta_faturamento == null) row.meta_faturamento = mm.fat_prev || null;
          await q(sb.from("soc_mes").upsert(row, { onConflict: "clinica_id,competencia" }));
          if (dd.length && !temPainel) await q(sb.from("soc_mes_dias").upsert(dd.map(d => ({ clinica_id: cid, data: d.data, recebido: d.recebido })), { onConflict: "clinica_id,data" }));
          if (pv.querySelector("#cxRes").checked) {
            const ups = Object.entries(l.r.meses).filter(([k, v]) => k < m0 && v.fat_caixa > 0).map(([k, v]) => ({ clinica_id: cid, competencia: k, faturamento: v.fat_caixa, ...(v.desp_real ? { despesas: Math.round(v.desp_real * 100) / 100 } : {}), atualizado_em: new Date().toISOString() }));
            for (const u of ups) await q(sb.from("soc_resultados").upsert(u, { onConflict: "clinica_id,competencia" }));
          }
          n++;
        }
        toast(n ? `${n} clínica${n > 1 ? "s" : ""} atualizada${n > 1 ? "s" : ""}` : "Nenhuma clínica escolhida"); await refresh();
      } catch (x) { toast(x.message); ev.target.disabled = false; }
    };
    e.target.value = "";
  };
}
function formMetas(m, comp, depois) {
  const v = x => x == null ? "" : Number(x).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  modal(`${(S.clins.find(c => c.id === m.clinica_id) || {}).nome} · ${ml(comp)}`, `<form id="fmt" novalidate>
    <div class="row2"><div class="f"><label class="lb" for="mf1">Meta de faturamento</label><input id="mf1" inputmode="decimal" value="${v(m.meta_faturamento)}"></div><div class="f"><label class="lb" for="mf2">Meta de despesas</label><input id="mf2" inputmode="decimal" value="${v(m.meta_despesa)}"></div></div>
    <div class="row2"><div class="f"><label class="lb" for="mf3">Meta de venda</label><input id="mf3" inputmode="decimal" value="${v(m.meta_venda)}"></div><div class="f"><label class="lb" for="mf4">Meta de cobrança <small class="mut">(vazio = faturamento − venda)</small></label><input id="mf4" inputmode="decimal" value="${v(m.meta_cobranca)}"></div></div>
    <div class="row2"><div class="f"><label class="lb" for="mf5">Venda realizada até hoje</label><input id="mf5" inputmode="decimal" value="${v(m.venda_realizada)}"></div><div class="f"><label class="lb" for="mf6">Dias úteis no mês <small class="mut">(vazio = automático: ${Caixa.diasUteis(comp).length})</small></label><input id="mf6" inputmode="numeric" value="${m.dias_uteis_total ?? ""}"></div></div>
    <div class="err" id="mfe"></div><button class="btn solid" type="submit" style="width:100%">Salvar</button></form>`, (el, close) => {
    el.querySelector("#fmt").onsubmit = async e => {
      e.preventDefault(); const g = id => parseNum(el.querySelector(id).value);
      const row = { clinica_id: m.clinica_id, competencia: comp, meta_faturamento: g("#mf1"), meta_despesa: g("#mf2"), meta_venda: g("#mf3"), meta_cobranca: g("#mf4"), venda_realizada: g("#mf5"), dias_uteis_total: g("#mf6"), atualizado_em: new Date().toISOString() };
      if (Object.values(row).some(x => Number.isNaN(x))) { el.querySelector("#mfe").textContent = "Há um número inválido."; return; }
      try { await q(sb.from("soc_mes").upsert(row, { onConflict: "clinica_id,competencia" })); close(); toast("Metas salvas"); depois(); } catch (x) { el.querySelector("#mfe").textContent = x.message; }
    };
  });
}

sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") { S.me = null; } });
boot();
})();
