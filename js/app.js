/*
 * app.js — 描画 ＋ 共有データ層（Supabase / localStorage）＋ 議事録全文モーダル
 * ------------------------------------------------------------------
 * - データは Store（Supabase 設定時は全員に即時共有、未設定時はこの端末に保存）。
 * - 初期値は js/data.js の window.DEFAULT_DATA。
 * - 時系列の各行クリックで、その回の議事録全文をモーダル表示。
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let DATA = clone(window.DEFAULT_DATA);

  const whoCls = { JM: "w-jm", DX: "w-dx", BOTH: "w-both" };
  const whoLbl = { JM: "JM", DX: "Dooox", BOTH: "JM×Dooox" };
  const statusLbl = { "p-done": "完了", "p-live": "完成", "p-go": "対応中", "p-run": "進行中" };

  /* ================= データ層（Firebase / Firestore ＋ フォールバック） =================
   * データ全体を JSON 文字列の1フィールド(json)として保存します。
   * （Firestore は「配列の中の配列」を保存できないため＝tasks が該当。文字列化で回避）
   */
  const Store = (function () {
    const cfg = window.FIREBASE_CONFIG || {};
    const docCfg = window.DASHBOARD_DOC || { collection: "dashboard", id: "japanmatex-dooox" };
    const LS_KEY = "jm-dooox-dashboard";
    let docRef = null;
    let mode = "local";

    if (cfg.projectId && cfg.apiKey && window.firebase) {
      try {
        firebase.initializeApp(cfg);
        docRef = firebase.firestore().collection(docCfg.collection).doc(docCfg.id);
        mode = "firebase";
      } catch (e) { console.warn("Firebase init failed → local:", e); mode = "local"; }
    }

    function unpack(snap) {
      if (snap && snap.exists) {
        const d = snap.data();
        if (d && d.json) { try { return JSON.parse(d.json); } catch (e) { /* ignore */ } }
      }
      return null;
    }

    async function load() {
      if (mode === "firebase") {
        try {
          const snap = await docRef.get();
          const got = unpack(snap);
          if (got) return got;
          await docRef.set({ json: JSON.stringify(window.DEFAULT_DATA), updatedAt: Date.now() });
          return clone(window.DEFAULT_DATA);
        } catch (e) { console.warn("Firestore load failed → local:", e); mode = "local"; }
      }
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { try { return JSON.parse(raw); } catch (e) { /* ignore */ } }
      return clone(window.DEFAULT_DATA);
    }

    async function save(data) {
      if (mode === "firebase") {
        try {
          await docRef.set({ json: JSON.stringify(data), updatedAt: Date.now() });
          return true;
        } catch (e) { console.warn("Firestore save failed → local:", e); mode = "local"; }
      }
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); return true; }
      catch (e) { console.warn(e); return false; }
    }

    function subscribe(cb) {
      if (mode !== "firebase") return;
      try {
        docRef.onSnapshot(
          (snap) => { const got = unpack(snap); if (got) cb(got); },
          (err) => console.warn("onSnapshot error:", err)
        );
      } catch (e) { console.warn("subscribe failed:", e); }
    }

    return { load, save, subscribe, status: () => mode };
  })();

  /* ================= 描画 ================= */
  function renderSync() {
    const s = $("sync");
    if (Store.status() === "firebase") { s.textContent = "🟢 全員に同期中"; s.className = "sync ok"; }
    else { s.textContent = "🟡 この端末のみ（共有未設定）"; s.className = "sync warn"; }
  }

  function renderHeader() {
    $("proj-title").textContent = DATA.project.title;
    $("proj-sub").textContent = DATA.project.subtitle;
    const noteEl = $("proj-note");
    if (noteEl) noteEl.textContent = DATA.project.note || "";
    $("proj-progress-note").innerHTML = DATA.progressNote || "";
    $("next-mtg").textContent = DATA.nextMeeting || "";
    $("foot").textContent = DATA.project.footer;
  }

  function renderKpis() {
    $("kpis").innerHTML = DATA.kpis.map((k) =>
      `<div class="kpi ${k.accent === "navy" ? "" : esc(k.accent)}">
        <div class="l">${esc(k.label)}</div>
        <div class="v">${esc(k.value)}<small> ${esc(k.unit)}</small></div>
      </div>`).join("");
  }

  function renderPhases() {
    $("phasebar").innerHTML = DATA.phases.map((p) =>
      `<div class="${esc(p.state)}" style="width:${p.pct}%">${esc(p.label)}</div>`).join("");
  }

  function deriveHighlights(t) {
    if (t.highlights && t.highlights.length) return t.highlights;
    if (t.summary) {
      const parts = t.summary.split(/。/).map((s) => s.trim()).filter(Boolean);
      if (parts.length) return parts.slice(0, 4).map((s) => s + "。");
    }
    return ["（議事録を反映しました）"];
  }

  function renderRecent() {
    const t = DATA.timeline && DATA.timeline[0];
    if (!t) { $("recent").innerHTML = '<div class="muted">データがありません</div>'; return; }
    const pts = deriveHighlights(t);
    $("recent").innerHTML =
      `<div class="recent-head">
         <span class="recent-date">${esc(t.date)}</span>
         <span class="recent-title">${esc(t.title)}</span>
       </div>
       <ul class="recent-pts">${pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
       <button class="ghost sm" id="recent-full">この回の議事録 全文を見る ›</button>`;
    $("recent-full").addEventListener("click", () => openModal(0));
  }

  function renderTasks() {
    $("tasks").querySelector("tbody").innerHTML = DATA.tasks.map((t) =>
      `<tr>
        <td>${esc(t[0])}</td>
        <td class="c"><span class="who ${whoCls[t[1]] || ""}">${esc(whoLbl[t[1]] || t[1])}</span></td>
        <td class="c">${esc(t[2])}</td>
        <td class="c"><span class="pill ${esc(t[3])}">${esc(statusLbl[t[3]] || "進行中")}</span></td>
      </tr>`).join("");
  }

  function renderTimeline() {
    $("timeline").innerHTML = DATA.timeline.map((t, i) =>
      `<div class="row" data-i="${i}" tabindex="0" role="button" aria-label="${esc(t.date)} ${esc(t.title)} の議事録を開く">
        <div class="dt">${esc(t.date)}</div>
        <div class="tlmain">
          <div class="th">${esc(t.title)}</div>
          <div class="ct">${esc(t.summary || "")}</div>
          <div class="more">議事録 全文 ›</div>
        </div>
      </div>`).join("");
    $("timeline").querySelectorAll(".row").forEach((r) => {
      const i = +r.dataset.i;
      r.addEventListener("click", () => openModal(i));
      r.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(i); }
      });
    });
  }

  function renderAll() {
    renderHeader(); renderKpis(); renderPhases(); renderRecent(); renderTasks(); renderTimeline();
  }

  /* ================= 全文モーダル ================= */
  function openModal(i) {
    const t = DATA.timeline[i];
    if (!t) return;
    $("modal-date").textContent = t.date;
    $("modal-title").textContent = t.title;
    $("modal-body").textContent = t.full || t.summary || "（議事録の本文がありません）";
    const m = $("modal");
    m.classList.add("show"); m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    const m = $("modal");
    m.classList.remove("show"); m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ================= 議事録パース（簡易） ================= */
  function parseMinutes(text) {
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const dateM = text.match(/20\d\d[\/\.\-]\s?\d{1,2}[\/\.\-]\s?\d{1,2}/);
    const date = dateM ? dateM[0].replace(/[\.\-]/g, "/").replace(/\s/g, "") : "新規";
    let head = lines.find((l) => !/^[・\-\*]/.test(l) && !/TODO|ToDo/i.test(l)) || "議事録 追加";
    head = head.replace(/^20\d\d[\/\.\-]\s?\d{1,2}[\/\.\-]\s?\d{1,2}\s*/, "") || "議事録 追加";

    const newTasks = [];
    lines.forEach((l) => {
      if (/TODO|ToDo/i.test(l)) {
        let who = "BOTH";
        if (/Dooox|ＤＸ|DX/i.test(l)) who = "DX";
        else if (/JM|ジャパン|先方|太田|カーター/i.test(l)) who = "JM";
        const due = (l.match(/期日[：:]\s?([0-9\/]+)/) || [])[1] || "—";
        const nm = l.replace(/^[・\-\*]\s*/, "")
          .replace(/TODO[（(].*?[)）][：:]?/i, "")
          .replace(/[（(]期日[：:].*?[)）]/, "")
          .replace(/TODO[：:]/i, "").trim();
        newTasks.push([nm || "新規タスク", who, due, "p-go"]);
      }
    });
    const bullets = lines.filter((l) => /^[・\-\*]/.test(l)).map((l) => l.replace(/^[・\-\*]\s*/, ""));
    const summary = bullets.slice(0, 3).join("／") || head.slice(0, 40);
    return {
      entry: { date, title: head.slice(0, 30), summary, full: text, highlights: bullets.slice(0, 4) },
      tasks: newTasks
    };
  }

  async function persistAndRender() {
    renderAll();
    const ok = await Store.save(DATA);
    if (!ok) toast("保存に失敗しました");
  }

  async function reflect() {
    const text = $("ta").value.trim();
    if (!text) { toast("議事録を入力してください"); return; }
    const r = parseMinutes(text);
    r.tasks.forEach((t) => DATA.tasks.unshift(t));
    DATA.timeline.unshift(r.entry);
    if (DATA.kpis[0]) DATA.kpis[0].value = DATA.timeline.length; // ミーティング実施回数
    await persistAndRender();
    const shared = Store.status() === "firebase" ? "／全員に共有" : "／この端末に保存";
    toast(`反映しました（タスク${r.tasks.length}件・議事録1件を追加${shared}）`);
    $("ta").value = "";
  }

  function sample() {
    $("ta").value =
      "2026/06/22 社長打合せ（着手施策の決定）\n" +
      "・着手施策を「入金管理マスター」に決定\n" +
      "・TODO（Dooox）：入金管理マスターのPoC設計（期日：6/30）\n" +
      "・TODO（JM）：販管CSVと入金条件表のサンプル共有（期日：6/27）";
  }

  /* ================= トースト ================= */
  let toastTimer;
  function toast(m) {
    const t = $("toast");
    t.textContent = m; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ================= 初期化 ================= */
  document.addEventListener("DOMContentLoaded", async () => {
    renderSync();
    renderAll();              // まず DEFAULT_DATA で即描画
    DATA = await Store.load(); // 保存済みデータで上書き
    renderSync();             // load 中に mode が変わる場合あり
    renderAll();

    Store.subscribe((remote) => {
      if (JSON.stringify(remote) === JSON.stringify(DATA)) return; // 自分の更新は無視
      DATA = remote; renderAll();
      toast("他のメンバーの更新を反映しました");
    });

    $("btn-reflect").addEventListener("click", reflect);
    $("btn-sample").addEventListener("click", sample);
    $("modal-x").addEventListener("click", closeModal);
    $("modal-bg").addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  });
})();
