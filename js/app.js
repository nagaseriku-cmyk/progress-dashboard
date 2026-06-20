/*
 * app.js — 画面の描画と、議事録テキストの簡易反映ロジック
 * ------------------------------------------------------------------
 * データは js/data.js の window.DATA を参照します。
 * 「議事録を反映」のパース部分（parseMinutes）を、本番では
 * LLM/API 呼び出しに差し替える想定です（reflect() 内のコメント参照）。
 */
(function () {
  "use strict";
  const DATA = window.DATA;
  const $ = (id) => document.getElementById(id);

  const whoCls = { JM: "w-jm", DX: "w-dx", BOTH: "w-both" };
  const whoLbl = { JM: "JM", DX: "Dooox", BOTH: "JM×Dooox" };
  const statusLbl = { "p-done": "完了", "p-live": "完成", "p-go": "対応中", "p-run": "進行中" };

  /* ---------- 描画 ---------- */
  function renderHeader() {
    $("proj-title").textContent = DATA.project.title;
    $("proj-sub").textContent = DATA.project.subtitle;
    $("proj-note").textContent = DATA.project.note;
    $("proj-progress-note").innerHTML = DATA.project.progressNote;
    $("foot").textContent = DATA.project.footer + "（デモ・ダミーデータ）";
  }

  function renderKpis() {
    $("kpis").innerHTML = DATA.kpis.map((k) =>
      `<div class="kpi ${k.accent === "navy" ? "" : k.accent}">
        <div class="l">${k.label}</div>
        <div class="v">${k.value}<small> ${k.unit}</small></div>
      </div>`).join("");
  }

  function renderPhases() {
    $("phasebar").innerHTML = DATA.phases.map((p) =>
      `<div class="${p.state}" style="width:${p.pct}%">${p.label}</div>`).join("");
  }

  function renderThemes() {
    $("themes").innerHTML = DATA.themes.map((t) => {
      const barColor = t.cls === "p-live" ? "background:#5b3e86" : "";
      return `<div class="theme">
        <div class="nm">${t.name}</div>
        <div class="bar"><i style="width:${t.pct}%;${barColor}"></i></div>
        <span class="pill ${t.cls}">${t.status}</span>
      </div>`;
    }).join("");
  }

  function renderTasks() {
    $("tasks").querySelector("tbody").innerHTML = DATA.tasks.map((t) =>
      `<tr>
        <td>${t[0]}</td>
        <td class="c"><span class="who ${whoCls[t[1]]}">${whoLbl[t[1]]}</span></td>
        <td class="c">${t[2]}</td>
        <td class="c"><span class="pill ${t[3]}">${statusLbl[t[3]] || "進行中"}</span></td>
      </tr>`).join("");
  }

  function renderTimeline() {
    $("timeline").innerHTML = DATA.timeline.map((t) =>
      `<div class="row">
        <div class="dt">${t[0]}</div>
        <div><div class="th">${t[1]}</div><div class="ct">${t[2]}</div></div>
      </div>`).join("");
  }

  function renderAll() {
    renderHeader(); renderKpis(); renderPhases(); renderThemes(); renderTasks(); renderTimeline();
  }

  /* ---------- 議事録の簡易パース ----------
   * 本番では、この関数を LLM/API 呼び出しに置き換えてください。
   * 例: const result = await fetch('/api/parse-minutes', {method:'POST', body:text})
   *     result から { timelineEntry, tasks[] } を受け取って DATA に push する。
   */
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
    const bullets = lines.filter((l) => /^[・\-\*]/.test(l)).slice(0, 3)
      .map((l) => l.replace(/^[・\-\*]\s*/, "")).join("／");

    return {
      timelineEntry: [date, head.slice(0, 24), bullets || "（議事録を反映）"],
      tasks: newTasks
    };
  }

  function reflect() {
    const text = $("ta").value.trim();
    if (!text) { toast("議事録を入力してください"); return; }
    const r = parseMinutes(text);
    r.tasks.forEach((t) => DATA.tasks.unshift(t));
    DATA.timeline.unshift(r.timelineEntry);
    // ヒアリング回数 KPI を更新（先頭が「ヒアリング実施」前提）
    if (DATA.kpis[0]) DATA.kpis[0].value = 11 + (DATA.timeline.length - 10);
    renderKpis(); renderTasks(); renderTimeline();
    toast(`反映しました（タスク${r.tasks.length}件・時系列1件を追加）`);
    $("ta").value = "";
  }

  function sample() {
    $("ta").value =
      "2026/06/22 社長打合せ（着手施策の決定）\n" +
      "・着手施策を「入金管理マスター」に決定\n" +
      "・TODO（Dooox）：入金管理マスターのPoC設計（期日：6/30）\n" +
      "・TODO（JM）：販管CSVと入金条件表のサンプル共有（期日：6/27）";
  }

  /* ---------- トースト ---------- */
  let toastTimer;
  function toast(m) {
    const t = $("toast");
    t.textContent = m; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- 初期化 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    $("btn-reflect").addEventListener("click", reflect);
    $("btn-sample").addEventListener("click", sample);
  });
})();
