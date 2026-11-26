/* Leitor da planilha de caixa das clínicas (abas "Fluxo Caixa" e "Previsao-Real").
   Devolve os recebimentos de cada dia e, por mês, faturamento e despesas (real e previsão). */
(function (root) {
  "use strict";
  const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const num = v => typeof v === "number" && isFinite(v) ? v : null;
  const pad = n => String(n).padStart(2, "0");
  function serialParaData(v) {
    if (typeof v !== "number" || v < 30000 || v > 80000) return null;
    const d = new Date(Math.round((v - 25569) * 864e5));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  function acharAba(wb, teste) { const n = wb.SheetNames.find(s => teste(norm(s))); return n ? wb.Sheets[n] : null; }
  function linhas(XLSX, ws) { return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }); }

  function lerCaixa(XLSX, wb) {
    const out = { dias: [], meses: {}, avisos: [], ano: null };
    // 1) Fluxo Caixa: data na 1ª coluna e "TOTAL RECEBIDO" no cabeçalho
    const fc = acharAba(wb, s => s.startsWith("fluxo"));
    if (!fc) out.avisos.push("Não achei a aba “Fluxo Caixa”.");
    else {
      const rs = linhas(XLSX, fc); let col = -1;
      for (let i = 0; i < Math.min(10, rs.length) && col < 0; i++) col = (rs[i] || []).findIndex(c => norm(c) === "total recebido");
      if (col < 0) out.avisos.push("Não achei a coluna “TOTAL RECEBIDO” na aba Fluxo Caixa.");
      else for (const r of rs) {
        const d = serialParaData(r[0]); if (!d) continue;
        const v = num(r[col]); out.dias.push({ data: d, recebido: v == null ? 0 : Math.round(v * 100) / 100 });
      }
      if (out.dias.length) out.ano = +out.dias[0].data.slice(0, 4);
    }
    // 2) Previsao-Real: linha com os meses; colunas REAL e PREVISÃO de cada mês
    const pr = acharAba(wb, s => s.includes("previs") && s.includes("real"));
    if (!pr) out.avisos.push("Não achei a aba “Previsao-Real”.");
    else {
      const rs = linhas(XLSX, pr); let colMes = null, ano = null;
      for (let i = 0; i < Math.min(10, rs.length); i++) {
        const r = rs[i] || [];
        for (const c of r) if (typeof c === "number" && c > 2000 && c < 2100) ano = ano || c;
        const idx = MESES.map(m => r.findIndex(c => norm(c) === m));
        if (idx.filter(x => x >= 0).length >= 6) { colMes = idx; break; }
      }
      out.ano = out.ano || ano;
      const rotulo = r => norm((r || []).slice(0, 3).find(c => typeof c === "string" && c.trim()) || "");
      const linha = nome => rs.find(r => rotulo(r) === nome);
      const rec = linha("receita total"), desp = linha("total despesas");
      if (!colMes) out.avisos.push("Não achei a linha com os meses na aba Previsao-Real.");
      else MESES.forEach((_, m) => {
        const c = colMes[m]; if (c < 0) return;
        const k = `${out.ano}-${pad(m + 1)}-01`;
        out.meses[k] = { fat_real: num(rec?.[c]), fat_prev: num(rec?.[c + 1]), desp_real: num(desp?.[c]), desp_prev: num(desp?.[c + 1]) };
      });
      if (!rec) out.avisos.push("Não achei a linha “RECEITA TOTAL”.");
      if (!desp) out.avisos.push("Não achei a linha “TOTAL DESPESAS”.");
    }
    // faturamento real de cada mês pelo caixa (mais confiável que fórmulas com #REF)
    for (const d of out.dias) { const k = d.data.slice(0, 8) + "01"; const m = out.meses[k] || (out.meses[k] = {}); m.fat_caixa = Math.round(((m.fat_caixa || 0) + d.recebido) * 100) / 100; }
    return out;
  }

  /* Dias úteis: segunda a sábado, sem feriados nacionais */
  function pascoa(Y) { const a = Y % 19, b = Math.floor(Y / 100), c = Y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1; return Date.UTC(Y, mes - 1, dia); }
  function feriados(ano) {
    const p = pascoa(ano), f = ms => new Date(p + ms * 864e5).toISOString().slice(0, 10);
    return new Set([`${ano}-01-01`, `${ano}-04-21`, `${ano}-05-01`, `${ano}-09-07`, `${ano}-10-12`, `${ano}-11-02`, `${ano}-11-15`, `${ano}-11-20`, `${ano}-12-25`, f(-48), f(-47), f(-2), f(60)]);
  }
  function diasUteis(competencia) {
    const [a, m] = competencia.split("-").map(Number), fer = feriados(a), out = [];
    for (let d = 1; d <= new Date(Date.UTC(a, m, 0)).getUTCDate(); d++) {
      const dt = new Date(Date.UTC(a, m - 1, d)), s = dt.toISOString().slice(0, 10);
      if (dt.getUTCDay() !== 0 && !fer.has(s)) out.push(s);
    }
    return out;
  }
  const api = { lerCaixa, diasUteis, feriados };
  if (typeof module !== "undefined") module.exports = api; else root.Caixa = api;
})(this);
