/* Results page: every chart is drawn from window.SITE_DATA (results.js) and window.SITE_EMB (embeddings.js),
   produced by export_site_data.py from the result files. Missing data is shown as unavailable, never invented. */
(function () {
  "use strict";
  const D = window.SITE_DATA || null;
  const E = window.SITE_EMB || null;
  const OURS = "#3273dc", OURS_RET = "#7fb2f0", PAGE_C = "#e67e22", GREY = "#b8bec6", GREEN = "#2e9d5b", RED = "#d9534f";
  const BASE_COLORS = ["#9aa5b1", "#c3a6d9", "#a8d5ba", "#f2c38b", "#9ecae1", "#d6a9a9", "#bcbd8a"];
  const CFG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] };
  const LAY = (extra) => Object.assign({
    margin: { l: 60, r: 20, t: 40, b: 60 }, font: { family: "Noto Sans, sans-serif", size: 12 },
    legend: { orientation: "h", y: -0.2 }, paper_bgcolor: "#fff", plot_bgcolor: "#fff", hovermode: "closest"
  }, extra || {});
  const $ = (id) => document.getElementById(id);
  const f1 = (v) => (v === null || v === undefined ? "–" : v.toFixed(1));
  const f2 = (v) => (v === null || v === undefined ? "–" : v.toFixed(2));
  const sci = (v) => (v === null || v === undefined ? "–" : v === 0 ? "0" : v.toExponential(1));

  function unavailable(id, msg) {
    const el = $(id); if (!el) return;
    Plotly.purge(el); el.innerHTML = `<div class="unavailable">${msg || "Not available in these result files."}</div>`;
  }
  function plot(id, traces, layout) {
    const el = $(id); if (!el) return;
    if (el.querySelector(".unavailable")) el.innerHTML = "";
    Plotly.react(el, traces, LAY(layout), CFG);
  }
  function group(name, cb) {
    const box = document.querySelector(`[data-group="${name}"]`); if (!box) return () => null;
    const buttons = box.querySelectorAll("button");
    buttons.forEach((b) => b.addEventListener("click", () => {
      buttons.forEach((x) => x.classList.remove("is-selected", "is-dark")); b.classList.add("is-selected", "is-dark"); cb(b.dataset.value);
    }));
    return () => box.querySelector(".is-selected").dataset.value;
  }
  function datasetButtons(id, names, cb, withAll) {
    const box = $(id); if (!box) return;
    box.innerHTML = ""; const list = (withAll ? ["All"] : []).concat(names);
    list.forEach((n, i) => {
      const b = document.createElement("button"); b.className = "button is-small" + (i === 0 ? " is-selected is-info" : "");
      b.textContent = n; b.dataset.value = n;
      b.addEventListener("click", () => { box.querySelectorAll("button").forEach((x) => x.classList.remove("is-selected", "is-info")); b.classList.add("is-selected", "is-info"); cb(n); });
      box.appendChild(b);
    });
  }
  function table(id, head, rows, oursCols) {
    const el = $(id); if (!el) return;
    const th = "<tr>" + head.map((h) => `<th>${h}</th>`).join("") + "</tr>";
    const tr = rows.map((r) => "<tr>" + r.map((c, i) => `<td class="${(oursCols || []).includes(i) ? "ours" : ""}">${c}</td>`).join("") + "</tr>").join("");
    el.innerHTML = `<table class="table is-striped is-narrow results"><thead>${th}</thead><tbody>${tr}</tbody></table>`;
  }

  // ------------------------------------------------------------------ tabs
  const DRAWN = {}, INIT = {};
  function show(tab) {
    if (!DRAWN[tab] && INIT[tab]) { DRAWN[tab] = true; INIT[tab].forEach((fn) => { try { fn(); } catch (err) { console.error(fn.name, err); } }); }
    $(tab).querySelectorAll(".js-plotly-plot").forEach((p) => Plotly.Plots.resize(p));
  }
  function tabs() {
    document.querySelectorAll("#result-tabs li").forEach((li) => li.addEventListener("click", () => {
      document.querySelectorAll("#result-tabs li").forEach((x) => x.classList.remove("is-active")); li.classList.add("is-active");
      document.querySelectorAll(".tab-pane").forEach((p) => (p.style.display = p.id === li.dataset.tab ? "" : "none"));
      show(li.dataset.tab);   // charts are drawn when their tab is visible (Plotly cannot measure hidden containers)
    }));
  }

  // ------------------------------------------------------------------ key numbers
  function keyNumbers() {
    const box = $("key-numbers"); if (!box || !D) return;
    const items = [];
    const ex = D.exactness;
    if (ex && ex.n) items.push([`${ex.n}`, `checks: unlearned model = retrained model (largest difference ${sci(ex.largest)})`]);
    const fg = D.forgetting && D.forgetting.canary_loss_attack;
    if (fg) {
      let same = 0, n = 0;
      ["client", "node"].forEach((l) => fg[l].forEach((r) => { if (r.unlearned !== null && r.retrained !== null) { n++; if (Math.abs(r.unlearned - r.retrained) < 1e-9) same++; } }));
      items.push([`${same}/${n}`, "attack scores after unlearning equal the retrained model's"]);
    }
    const t = D.accuracy && D.accuracy.time_per_request;
    if (t && t.client) {
      const s = t.client.filter((x) => x).map((x) => x.retrain / x.unlearn).sort((a, b) => a - b);
      if (s.length) items.push([`${s[Math.floor(s.length / 2)].toFixed(0)}×`, "median speed-up of a client-level request over retraining all clients"]);
    }
    items.push(["0", "messages needed from a removed client"]);
    box.innerHTML = items.map(([v, l]) => `<div class="column is-3 key-number"><div class="value">${v}</div><div class="label">${l}</div></div>`).join("");
  }

  // ------------------------------------------------------------------ accuracy
  function accuracy() {
    const A = D && D.accuracy; if (!A || !A.ours) { unavailable("chart-accuracy"); unavailable("chart-gap"); return; }
    const names = A.datasets;
    let level = "client", ds = "All";
    const gap = () => {
      const g = A.gap_to_own_retraining[level]; const methods = Object.keys(g);
      plot("chart-gap", [{ type: "heatmap", z: methods.map((m) => g[m]), x: names, y: methods, zmid: 0,
        colorscale: [[0, "#b2182b"], [0.5, "#f7f7f7"], [1, "#2166ac"]], text: methods.map((m) => g[m].map((v) => v === null ? "–" : v.toFixed(2))),
        texttemplate: "%{text}", hovertemplate: "%{y} on %{x}: %{z:.2f} points<extra></extra>", colorbar: { title: "points" } }],
        { height: 360, margin: { l: 110, r: 20, t: 20, b: 50 } });
    };
    const draw = () => {
      const rep = A.reported[level]; const methods = Object.keys(rep);
      const ours = A.ours[level];
      if (ds === "All") {
        const traces = methods.map((m, i) => ({
          type: "bar", name: m + (A.venues[m] ? ` (${A.venues[m]})` : ""), x: names, y: rep[m].map((v) => v[0]),
          error_y: { type: "data", array: rep[m].map((v) => v[1]), visible: true, thickness: 1 },
          marker: { color: m === "PAGE" ? PAGE_C : BASE_COLORS[i % BASE_COLORS.length] }, hovertemplate: "%{x}: %{y:.2f}<extra>" + m + "</extra>"
        }));
        traces.push({ type: "bar", name: "Ours (unlearned)", x: names, y: ours.unlearned.map((v) => v[0]), marker: { color: OURS },
          error_y: { type: "data", array: ours.unlearned.map((v) => v[1]), visible: true, thickness: 1 }, hovertemplate: "%{x}: %{y:.2f}<extra>Ours</extra>" });
        traces.push({ type: "bar", name: "Ours, retrained from scratch", x: names, y: ours.retrained.map((v) => v[0]), marker: { color: OURS_RET },
          hovertemplate: "%{x}: %{y:.2f}<extra>Ours retrained</extra>" });
        plot("chart-accuracy", traces, { barmode: "group", yaxis: { title: "Test accuracy (%)", range: [30, 100] }, height: 460 });
      } else {
        const j = names.indexOf(ds);
        const rows = methods.map((m) => [m, rep[m][j][0], rep[m][j][1], m === "PAGE" ? PAGE_C : GREY])
          .concat([["Ours, retrained from scratch", ours.retrained[j][0], ours.retrained[j][1], OURS_RET], ["Ours (unlearned)", ours.unlearned[j][0], ours.unlearned[j][1], OURS]])
          .filter((r) => r[1] !== null).sort((a, b) => a[1] - b[1]);
        plot("chart-accuracy", [{ type: "bar", orientation: "h", y: rows.map((r) => `${r[0]} · ${r[1].toFixed(2)}`), x: rows.map((r) => r[1]),
          error_x: { type: "data", array: rows.map((r) => r[2]), visible: true }, marker: { color: rows.map((r) => r[3]) },
          hovertemplate: "%{y}<extra></extra>" }],
          { xaxis: { title: `Test accuracy (%) on ${ds} (axis starts near the lowest method)`, range: [Math.max(0, Math.floor(Math.min(...rows.map((r) => r[1] - (r[2] || 0))) - 3)), 100] },
            margin: { l: 250, r: 40, t: 30, b: 50 }, height: 420, showlegend: false });
      }
      $("acc-caption").textContent = `${level === "client" ? "Client-level" : "Node-level"} request. Baselines: numbers reported in our AAAI submission (not rerun on our splits). ` +
        `Ours: mean ± std over seeds ${(A.seeds || []).join(", ")}; the unlearned and retrained models coincide.`;
      gap();
    };
    group("acc-level", (v) => { level = v; draw(); });
    datasetButtons("acc-datasets", names, (v) => { ds = v; draw(); }, true);
    draw();
    const pc = ["client", "node"].map((l) => A.ours[l]);
    if (pc[0].global_mean_over_clients.every((v) => v[0] === null)) {
      $("table-perclient").innerHTML = `<div class="unavailable">Per-client and local-model results are not in these result files (rerun the main step with the current code).</div>`;
    } else {
      table("table-perclient", ["Dataset", "Client: pooled", "Client: mean over clients", "Client: local", "Client: personalized",
        "Node: pooled", "Node: mean over clients", "Node: local", "Node: personalized"],
        names.map((n, j) => [n].concat(...pc.map((o) => [f1(o.unlearned[j][0]), f1(o.global_mean_over_clients[j][0]), f1(o.local_mean_over_clients[j][0]), f1(o.personalized_mean_over_clients[j][0])]))));
    }
  }

  // ------------------------------------------------------------------ exactness
  function exactness() {
    const X = D && D.exactness; if (!X || !X.histogram) { unavailable("chart-exact-hist"); return; }
    const h = X.histogram;
    const labels = ["bit-identical"].concat(h.bins.map((b) => { const e = +b.slice(2); return `1e${e} – 1e${e + 1}`; }));
    plot("chart-exact-hist", [{ type: "bar", x: labels, y: [h.bit_identical].concat(h.counts), marker: { color: [GREEN].concat(h.counts.map(() => OURS)) },
      hovertemplate: "%{x}: %{y} checks<extra></extra>" }],
      { title: { text: `${X.n} checks, largest difference ${sci(X.largest)}`, font: { size: 14 } }, yaxis: { title: "checks (log scale)", type: "log" },
        xaxis: { title: "largest |W unlearned − W retrained|", tickangle: -40 }, height: 400, margin: { l: 60, r: 20, t: 40, b: 110 } });
    table("table-exact-sources", ["Experiment", "Checks", "Bit-identical", "Largest"],
      Object.entries(X.sources).map(([k, v]) => [k, v.n, v.bit_identical, sci(v.largest)]));
    if (X.r7) table("table-r7", ["Precision", "Runs", "Largest relative error", "Largest condition number", "Prediction agreement"],
      X.r7.map((r) => [r.dtype, r.runs, sci(r.largest_rel), sci(r.largest_cond), r.agreement === null ? "–" : (100 * r.agreement).toFixed(1) + "%"]));
    else $("table-r7").innerHTML = `<div class="unavailable">Not available.</div>`;
  }

  // ------------------------------------------------------------------ forgetting
  function forgetting() {
    const F = D && D.forgetting; const names = D && D.accuracy ? D.accuracy.datasets : [];
    if (!F || !F.canary_loss_attack) { unavailable("chart-forgetting"); } else {
      const draw = (level) => {
        const r = F.canary_loss_attack[level];
        plot("chart-forgetting", [
          { type: "bar", name: "Original model", x: names, y: r.map((v) => v.original), marker: { color: RED } },
          { type: "bar", name: "After unlearning", x: names, y: r.map((v) => v.unlearned), marker: { color: OURS } },
          { type: "bar", name: "Retrained from scratch", x: names, y: r.map((v) => v.retrained), marker: { color: OURS_RET } }],
          { barmode: "group", yaxis: { title: "Attack AUC", range: [0.3, 1] }, height: 400,
            shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, y0: 0.5, y1: 0.5, line: { dash: "dot", color: "#999" } }] });
      };
      group("forget-level", draw); draw("client");
    }
    const T = F && F.three_attacks;
    if (!T || !Object.keys(T).length) { unavailable("chart-three-attacks"); return; }
    const ds = Object.keys(T), att = [["loss_auc", "Loss"], ["entropy_auc", "Entropy"], ["lira_auc", "LiRA-style"]];
    const x = []; ds.forEach((d) => att.forEach(([, n]) => x.push(`${d} · ${n}`)));
    const tr = [["original", "Original", RED], ["unlearned", "After unlearning", OURS], ["retrained", "Retrained", OURS_RET]].map(([k, n, c]) => ({
      type: "bar", name: n, x, marker: { color: c }, y: ds.flatMap((d) => att.map(([a]) => T[d][k][a])) }));
    plot("chart-three-attacks", tr, { barmode: "group", yaxis: { title: "Attack AUC", range: [0.3, 1] }, height: 380, margin: { l: 60, r: 20, t: 20, b: 110 } });
  }

  // ------------------------------------------------------------------ gates and training procedure
  function gates() {
    const G = D && D.gates;
    if (G && G.ablation) {
      const V = ["none", "contribution_only", "structural_only", "both_gates", "cf_retrain"];
      const lab = ["No gate", "Contribution only", "Structural only", "Both gates", "Retrained"];
      const col = [RED, "#f0ad4e", "#c49a00", OURS, OURS_RET];
      const m = (k) => V.map((v) => (G.ablation[v] || {})[k]);
      plot("chart-gate-ablation", [
        { type: "bar", x: lab, y: m("max_abs_W_diff"), marker: { color: col }, xaxis: "x", yaxis: "y", hovertemplate: "%{x}: %{y:.3g}<extra>largest weight difference</extra>" },
        { type: "bar", x: lab, y: m("flips"), marker: { color: col }, xaxis: "x2", yaxis: "y2", hovertemplate: "%{x}: %{y:.0f}<extra>predictions that differ</extra>" },
        { type: "bar", x: lab, y: m("mia_lira_auc"), marker: { color: col }, xaxis: "x3", yaxis: "y3", hovertemplate: "%{x}: %{y:.2f}<extra>LiRA AUC</extra>" }],
        { grid: { rows: 1, columns: 3, pattern: "independent" }, showlegend: false, height: 380, margin: { l: 50, r: 10, t: 50, b: 110 },
          annotations: [["Largest weight difference", 0.14], ["Predictions that differ", 0.5], ["LiRA AUC on deleted nodes", 0.86]].map(([t, x]) => ({ text: t, x, y: 1.12, xref: "paper", yref: "paper", showarrow: false, font: { size: 13 } })) });
    } else unavailable("chart-gate-ablation");
    if (G && G.jsd_by_region) {
      const R = ["deleted", "1hop", "2hop", "rest", "other_clients"], Rl = ["deleted", "1-hop", "2-hop", "rest of client", "other clients"];
      const V = [["original", "No unlearning", RED], ["contrib_only", "Contribution only", "#f0ad4e"], ["struct_only", "Structural only", "#c49a00"], ["both", "Both gates", OURS]];
      plot("chart-jsd-region", V.map(([k, n, c]) => ({ type: "bar", name: n, x: Rl, marker: { color: c }, y: R.map((r) => Math.max(G.jsd_by_region[k][r], 1e-18)) })),
        { barmode: "group", yaxis: { type: "log", title: "JSD to retrained (floor 1e-18)" }, height: 380, title: { text: "Divergence by region", font: { size: 13 } } });
      const W = [["contrib_only", "Contribution only"], ["struct_only", "Structural only"], ["both", "Both gates"]];
      plot("chart-recovered", [{ type: "heatmap", x: Rl, y: W.map((w) => w[1]), z: W.map(([k]) => R.map((r) => G.recovered_share[k][r])), zmin: -0.5, zmax: 1,
        colorscale: "RdBu", texttemplate: "%{z:.2f}", hovertemplate: "%{y}, %{x}: %{z:.2f}<extra></extra>" }],
        { height: 380, margin: { l: 120, r: 20, t: 40, b: 60 }, title: { text: "Share of the change recovered", font: { size: 13 } } });
    } else { unavailable("chart-jsd-region"); unavailable("chart-recovered"); }
    const T = D && D.training;
    if (T && T.fedavg_baselines) {
      const V = ["gd_none", "gd_finetune_10", "gd_finetune_50", "gd_ascent5_finetune10", "gd_retrain"];
      const L = ["No unlearning", "Fine-tune 10", "Fine-tune 50", "Ascent + fine-tune", "Retrained"];
      plot("chart-gd", [
        { type: "bar", name: "LiRA AUC on deleted nodes", x: L, y: V.map((v) => T.fedavg_baselines[v].mia_lira_auc), marker: { color: RED } },
        { type: "scatter", mode: "markers+lines", name: "largest weight difference", x: L, y: V.map((v) => T.fedavg_baselines[v].max_abs_W_diff), yaxis: "y2", marker: { color: "#333", size: 9 } }],
        { yaxis: { title: "LiRA AUC", range: [0, 1] }, yaxis2: { title: "weight difference", overlaying: "y", side: "right" }, height: 380,
          title: { text: `FedAvg-trained model (${(T.datasets || []).join(", ")})`, font: { size: 13 } } });
    } else unavailable("chart-gd", "The training-procedure ablation (part 2) is not in these result files.");
    if (T && T.feature_design) {
      const ds = Object.keys(T.feature_design), vs = Object.keys(T.feature_design[ds[0]]);
      plot("chart-features", vs.map((v, i) => ({ type: "bar", name: v, x: ds, y: ds.map((d) => T.feature_design[d][v]), marker: { color: BASE_COLORS[i % BASE_COLORS.length] } })),
        { barmode: "group", yaxis: { title: "Test accuracy (%)", range: [30, 100] }, height: 380, title: { text: "Feature design", font: { size: 13 } } });
    } else unavailable("chart-features", "The feature-design ablation (part 3) is not in these result files.");
  }

  // ------------------------------------------------------------------ robustness
  function robustness() {
    const R = D && D.robustness; if (!R) { unavailable("chart-robustness"); return; }
    let view = "ratio", ds = null, built = null;
    const keyOf = { ratio: "deletion_ratio", sequence: "sequence", partitions: "partitions", poisoning: "poisoning", edges: "edges_features", hyper: "hyperparameters" };
    const setDs = (names) => { const k = names.join(); if (built === k) return; built = k; datasetButtons("rob-datasets", names, (v) => { ds = v; draw(); }); };
    const draw = () => {
      const block = R[keyOf[view]]; if (!block || !Object.keys(block).length) { unavailable("chart-robustness"); $("rob-caption").textContent = ""; return; }
      const names = Object.keys(block); if (!names.includes(ds)) ds = names[0];
      setDs(names); const b = block[ds];
      if (view === "ratio") {
        const traces = [];
        Object.entries(b).forEach(([kind, byR]) => {
          const rs = Object.keys(byR).map(Number).sort((a, c) => a - c);
          [["original", RED, "Original"], ["unlearned", OURS, "Unlearned"], ["retrained", OURS_RET, "Retrained"]].forEach(([k, c, n]) =>
            traces.push({ type: "scatter", mode: "lines+markers", name: `${n} (${kind})`, x: rs.map((r) => 100 * r), y: rs.map((r) => byR[String(r)][k]),
              line: { color: c, dash: kind === "client" ? "dash" : "solid" }, marker: { size: k === "retrained" ? 5 : 8 } }));
        });
        plot("chart-robustness", traces, { xaxis: { title: "deleted share (%)" }, yaxis: { title: "Test accuracy (%)" }, height: 420 });
        const dW = Math.max(...Object.values(b).flatMap((byR) => Object.values(byR).map((v) => v.dW)));
        $("rob-caption").textContent = `${ds}: accuracy as the deleted share grows (R1). Largest weight difference to retraining over all ratios: ${sci(dW)}.`;
      } else if (view === "sequence") {
        plot("chart-robustness", [{ type: "scatter", mode: "lines+markers", x: b.steps, y: b.acc, line: { color: OURS }, name: "unlearned = retrained" }],
          { xaxis: { title: "request number" }, yaxis: { title: "Test accuracy (%)" }, height: 400 });
        $("rob-caption").textContent = `${ds}: mixed node- and client-level requests in sequence (R2). Largest weight difference to retraining at any step: ${sci(b.dW)}.`;
      } else if (view === "partitions") {
        const parts = Object.keys(b), ns = [...new Set(parts.flatMap((p) => Object.keys(b[p])))].map(Number).sort((x, y) => x - y).map(String);
        plot("chart-robustness", [{ type: "heatmap", x: ns, y: parts, z: parts.map((p) => ns.map((n) => b[p][n] ? b[p][n].acc : null)),
          texttemplate: "%{z:.1f}", colorscale: "Blues", hovertemplate: "%{y}, %{x} clients: %{z:.1f}%<extra></extra>", colorbar: { title: "acc %" } }],
          { xaxis: { title: "number of clients", type: "category" }, height: 360, margin: { l: 90, r: 20, t: 20, b: 60 } });
        const dW = Math.max(...parts.flatMap((p) => Object.values(b[p]).map((v) => v.dW)));
        $("rob-caption").textContent = `${ds}: accuracy after a client-level request, by partition and number of clients (R4). Largest weight difference: ${sci(dW)}. Empty cells: the partition cannot form that many non-empty clients.`;
      } else if (view === "poisoning") {
        const v = [b.clean, b.poisoned, b.after_unlearning, b.retrained_clean];
        plot("chart-robustness", [{ type: "bar", x: ["Clean", "Poisoned", "After unlearning the poison", "Retrained on clean data"],
          y: v, marker: { color: [GREEN, RED, OURS, OURS_RET] }, text: v.map(f1), textposition: "outside" }],
          { yaxis: { title: "Test accuracy (%)" }, height: 380, showlegend: false });
        $("rob-caption").textContent = `${ds}: label flipping in some clients, then unlearning the poisoned data (R5). Largest weight difference: ${sci(b.dW)}.`;
      } else if (view === "edges") {
        const ks = Object.keys(b);
        plot("chart-robustness", [["original", RED, "Original"], ["unlearned", OURS, "Unlearned"], ["retrained", OURS_RET, "Retrained"]].map(([k, c, n]) =>
          ({ type: "bar", name: n, x: ks, y: ks.map((x) => b[x][k]), marker: { color: c } })), { barmode: "group", yaxis: { title: "Test accuracy (%)" }, height: 380 });
        $("rob-caption").textContent = `${ds}: deleting edges or feature values (R3). Largest weight difference: ${sci(Math.max(...ks.map((x) => b[x].dW)))}.`;
      } else if (view === "hyper") {
        const lab = b.map((r) => `${r.form} L=${r.L} rf=${r.rf} γ=${r.lam}`);
        plot("chart-robustness", [{ type: "scatter", mode: "markers", x: lab, y: b.map((r) => r.acc), marker: { color: OURS, size: 9 },
          customdata: b.map((r) => sci(r.dW)), hovertemplate: "%{x}<br>accuracy %{y:.1f}%<br>weight difference %{customdata}<extra></extra>" }],
          { yaxis: { title: "Test accuracy (%)" }, xaxis: { tickangle: -60, tickfont: { size: 9 } }, height: 460, margin: { l: 60, r: 20, t: 20, b: 170 } });
        $("rob-caption").textContent = `${ds}: every hyperparameter setting (R10). Largest weight difference to retraining: ${sci(Math.max(...b.map((r) => r.dW)))}.`;
      }
    };
    group("rob-view", (v) => { view = v; draw(); });
    draw();
  }

  // ------------------------------------------------------------------ scalability
  function scalability() {
    const A = D && D.accuracy, R = D && D.robustness, L = D && D.locality;
    if (A && A.time_per_request) {
      const draw = (level) => {
        const t = A.time_per_request[level], names = A.datasets;
        plot("chart-time", [
          { type: "bar", name: "Unlearning (gates + one solve)", x: names, y: t.map((v) => v ? v.unlearn : null), marker: { color: OURS } },
          { type: "bar", name: "Retraining all clients from scratch", x: names, y: t.map((v) => v ? v.retrain : null), marker: { color: GREY },
            customdata: t.map((v) => v ? (v.retrain / v.unlearn).toFixed(1) + "×" : ""), hovertemplate: "%{x}: %{y:.3f} s (%{customdata} slower)<extra></extra>" }],
          { barmode: "group", yaxis: { type: "log", title: "seconds per request" }, height: 380 });
      };
      group("time-level", draw); draw("client");
    } else unavailable("chart-time");
    if (R && R.cost) table("table-cost", ["Dataset", "Node request (s)", "Client request (s)", "Training (s)", "Upload per client (MB)", "Server storage (MB)", "FedAvg GCN, 100 rounds (MB)"],
      Object.entries(R.cost).map(([d, c]) => [d, c.node_s.toFixed(3), c.client_s.toFixed(3), c.train_s.toFixed(2), f1(c.comm_mb), c.server_mb.toFixed(0), f1(c.fedavg_gcn_100_mb)]));
    if (L) {
      const draw = (v) => {
        const g = L.grid[v], Ls = Object.keys(g);
        const pct = v !== "speedup_local_vs_full";
        plot("chart-locality", [{ type: "heatmap", x: L.sizes, y: Ls.map((l) => "L = " + l), z: Ls.map((l) => g[l].map((x) => x === null ? null : pct ? 100 * x : x)),
          texttemplate: pct ? "%{z:.0f}%" : "%{z:.2f}×", colorscale: pct ? "Oranges" : [[0, "#d9534f"], [0.5, "#f7f7f7"], [1, "#2e9d5b"]], zmid: pct ? undefined : 1,
          hovertemplate: "%{y}, deleting %{x}: %{z:.2f}<extra></extra>" }],
          { xaxis: { title: "deleted nodes (share of the client)" }, height: 330, margin: { l: 70, r: 20, t: 20, b: 60 } });
        const uv = Object.entries(L.unlearn_vs_retrain).map(([d, s]) => `${d} ${s.toFixed(1)}×`).join(", ");
        $("loc-caption").textContent = (v === "speedup_local_vs_full" ? "Median speed-up of recomputing only the affected rows over recomputing the whole client (above 1 = local is faster). "
          : v === "rows" ? "Median share of the client's feature rows that change (within L+1 hops). " : "Median share of the client that must be read (within 2L+2 hops). ") +
          `Projection width p = ${L.p.join(", ")}; local update vs retraining up to ${sci(L.rel_err)} (relative). Unlearning vs retraining all clients: ${uv}.`;
      };
      group("loc-view", draw); draw("rows");
    } else unavailable("chart-locality");
  }

  // ------------------------------------------------------------------ privacy
  function privacy() {
    const P = (D && D.privacy) || {};
    if (P.dimension_cap && P.dimension_cap.length) {
      const r = P.dimension_cap;
      plot("chart-cap", [
        { type: "bar", name: "Per-client view", x: r.map((v) => v.dataset), y: r.map((v) => v.per_client), marker: { color: RED } },
        { type: "bar", name: "Sum-only view (secure aggregation)", x: r.map((v) => v.dataset), y: r.map((v) => v.sum_only), marker: { color: OURS } }],
        { barmode: "group", yaxis: { title: "Attack AUC", range: [0.4, 1.02] }, height: 380,
          shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, y0: 0.5, y1: 0.5, line: { dash: "dot", color: "#999" } }] });
    } else unavailable("chart-cap");
    if (P.fedavg_comparison && P.fedavg_comparison.length) {
      const tr = [];
      P.fedavg_comparison.forEach((e, i) => {
        const c = ["#3273dc", "#e67e22", "#2e9d5b", "#d9534f", "#8e44ad", "#16a085", "#7f8c8d", "#c0392b", "#2c3e50"][i % 9];
        tr.push({ type: "scatter", mode: "lines", name: `${e.dataset} s${e.seed}`, x: e.curve.map((p) => p.rounds), y: e.curve.map((p) => p.auc), line: { color: c },
          customdata: e.curve.map((p) => (100 * p.acc).toFixed(1)), hovertemplate: "round %{x}: AUC %{y:.2f} (FedAvg accuracy %{customdata}%)<extra></extra>" });
        tr.push({ type: "scatter", mode: "lines", name: `${e.dataset} s${e.seed}: our statistics`, x: [e.curve[0].rounds, e.curve[e.curve.length - 1].rounds], y: [e.cf_auc, e.cf_auc],
          line: { color: c, dash: "dash" }, showlegend: false, hovertemplate: `our statistics: AUC %{y:.2f} (accuracy ${(100 * e.cf_acc).toFixed(1)}%)<extra></extra>` });
      });
      plot("chart-fedavg", tr, { xaxis: { title: "FedAvg rounds", type: "log" }, yaxis: { title: "Attack AUC", range: [0.4, 1.02] }, height: 400, legend: { font: { size: 9 }, orientation: "h", y: -0.3 } });
    } else unavailable("chart-fedavg");
    if (P.dp_cost) {
      const eps = ["inf", "8.0", "4.0", "2.0", "1.0", "0.5"];
      plot("chart-dp", Object.entries(P.dp_cost).map(([d, v], i) => ({ type: "scatter", mode: "lines+markers", name: d, x: eps.map((e) => e === "inf" ? "∞" : e), y: eps.map((e) => v[e]),
        line: { width: 2 } })), { xaxis: { title: "privacy budget ε (smaller = more private)", type: "category" }, yaxis: { title: "Test accuracy (%)" }, height: 400 });
    } else unavailable("chart-dp");
    if (P.membership_vs_gcn) table("table-membership", ["Dataset", "Model", "Test accuracy (%)", "Loss attack AUC", "LiRA AUC"],
      Object.entries(P.membership_vs_gcn).flatMap(([d, m]) => Object.entries(m).map(([k, v]) => [d, { cf: "Ours (closed form)", fedavg_linear: "Same model, FedAvg", gcn: "FedAvg GCN" }[k] || k, f1(v.acc), f2(v.loss), f2(v.lira)])));
  }

  // ------------------------------------------------------------------ representation space
  function representation() {
    if (!E || !Object.keys(E).length) {
      unavailable("chart-embedding", "Run <code>python export_site_data.py --res results --out site/static/data --embeddings</code> to compute this view.");
      $("emb-states").innerHTML = ""; return;
    }
    const names = Object.keys(E); let ds = names[0], space = "prediction", state = "original";
    const STATES = Object.keys(E[ds].prediction);
    const ROLE = { deleted: ["Deleted nodes", RED, 9], "1-hop": ["1-hop neighbours", "#f0ad4e", 7], "2-hop": ["2-hop neighbours", "#5bc0de", 6], other: ["Other nodes of the client", "#9aa5b1", 5] };
    const ranges = {};
    const range = () => {
      const k = ds + space; if (ranges[k]) return ranges[k];
      const pts = Object.values(E[ds][space]).flat().filter((p) => p[0] !== null);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const pad = (a) => { const lo = Math.min(...a), hi = Math.max(...a), d = (hi - lo) * 0.06 || 1; return [lo - d, hi + d]; };
      return (ranges[k] = [pad(xs), pad(ys)]);
    };
    const draw = () => {
      const e = E[ds], pts = e[space][state], [rx, ry] = range();
      const traces = Object.entries(ROLE).map(([role, [name, color, size]]) => {
        const idx = e.role.map((r, i) => (r === role ? i : -1)).filter((i) => i >= 0);
        return { type: "scatter", mode: "markers", name, x: idx.map((i) => pts[i][0]), y: idx.map((i) => pts[i][1]), ids: idx.map(String),
          marker: { color, size, opacity: 0.8, line: { width: role === "deleted" ? 1 : 0, color: "#7a1f1f" } },
          customdata: idx.map((i) => [e.label[i], e.predicted_class[state][i] === null ? "–" : e.predicted_class[state][i]]),
          hovertemplate: "label %{customdata[0]}, predicted %{customdata[1]}<extra>" + name + "</extra>" };
      });
      Plotly.react($("chart-embedding"), traces, LAY({ xaxis: { range: rx, title: "PC 1", zeroline: false }, yaxis: { range: ry, title: "PC 2", zeroline: false }, height: 560,
        title: { text: `${ds}: ${state}`, font: { size: 14 } }, transition: { duration: 700, easing: "cubic-in-out" } }), CFG);
      const w = e.max_abs_W_diff;
      $("emb-caption").innerHTML = `${ds}, client ${e.client} (${e.n_client_nodes} nodes), ${e.n_deleted} nodes deleted, seed ${e.seed}. ` +
        `Largest weight difference to the retrained model: contribution gate only ${sci(w.contribution)}, structural gate only ${sci(w.structural)}, both gates ${sci(w.both)}. ` +
        `Unlearned and retrained models predict the same class for ${(100 * e.agreement_unlearned_retrained).toFixed(1)}% of the retained nodes shown. ` +
        `Axes: PCA fitted on the original model, shared by all states. Deleted nodes have no position after retraining (they no longer exist).`;
    };
    const sb = $("emb-states"); sb.innerHTML = "";
    STATES.forEach((s, i) => {
      const b = document.createElement("button"); b.className = "button is-small" + (i === 0 ? " is-selected is-dark" : ""); b.textContent = s; b.dataset.value = s;
      b.addEventListener("click", () => { sb.querySelectorAll("button[data-value]").forEach((x) => x.classList.remove("is-selected", "is-dark")); b.classList.add("is-selected", "is-dark"); state = s; draw(); });
      sb.appendChild(b);
    });
    const play = document.createElement("button"); play.className = "button is-small is-info is-light"; play.textContent = "▶ Play";
    play.addEventListener("click", () => { let i = 0; const btns = [...sb.querySelectorAll("button[data-value]")]; const step = () => { if (i >= btns.length) return; btns[i].click(); i++; setTimeout(step, 1300); }; step(); });
    sb.appendChild(play);
    datasetButtons("emb-datasets", names, (v) => { ds = v; draw(); });
    group("emb-space", (v) => { space = v; draw(); });
    draw();
  }

  // ------------------------------------------------------------------ motivation
  function motivation() {
    const M = D && D.motivation; if (!M) { unavailable("chart-motivation"); return; }
    const names = Object.keys(M.by_dataset);
    const E4 = [["none", "No edit", GREY], ["random", "Random edit", "#c3a6d9"], ["discovered", "Discovered edit", "#f0ad4e"], ["oracle", "Oracle edit", RED]];
    const draw = (which) => {
      const key = which === "Retained nodes" ? "retained" : "target";
      plot("chart-motivation", E4.map(([k, n, c]) => ({ type: "bar", name: n, x: names, y: names.map((d) => M.by_dataset[d][k][key]), marker: { color: c } })),
        { barmode: "group", yaxis: { title: "distance to the retrained GNN" }, height: 400 });
      $("mot-caption").textContent = `Editing the representations of a trained federated GNN (our earlier, gated design) with knowledge of what to remove: distance to the GNN retrained without the client, on ${key === "target" ? "the target client's" : "the retained"} nodes. ` +
        `The oracle edit moved further from retraining than no edit in ${M.oracle_further_target} of ${M.runs} runs on the target client's nodes and ${M.oracle_further_retained} of ${M.runs} on retained nodes.`;
    };
    datasetButtons("mot-datasets", ["Target client", "Retained nodes"], draw);
    draw("Target client");
  }

  // ------------------------------------------------------------------ boot
  document.addEventListener("DOMContentLoaded", () => {
    tabs();
    if (!D) { document.querySelectorAll(".chart").forEach((c) => (c.innerHTML = `<div class="unavailable">static/data/results.js is missing.</div>`)); return; }
    if (D.preview) $("preview-banner").style.display = "";
    $("data-note").textContent = `Generated ${D.generated} from the result files${D.accuracy && D.accuracy.seeds ? ` (main protocol seeds ${D.accuracy.seeds.join(", ")})` : ""}. Hover any chart for values.`;
    try { keyNumbers(); } catch (err) { console.error(err); }
    Object.assign(INIT, { "t-accuracy": [accuracy], "t-exactness": [exactness], "t-forgetting": [forgetting], "t-gates": [gates],
      "t-robustness": [robustness], "t-scalability": [scalability], "t-privacy": [privacy], "t-representation": [representation], "t-motivation": [motivation] });
    show("t-accuracy");
  });

  window.copyBibTeX = function () {
    const t = document.querySelector("#bibtex-code code").textContent;
    const done = () => { const s = document.querySelector(".copy-text"); s.textContent = "Copied"; setTimeout(() => (s.textContent = "Copy"), 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done).catch(() => {});
  };
})();
