# Project page: Exact Federated Graph Unlearning

Built on the [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template)
(Bulma, same folder layout). Every chart is drawn from two data files produced from the experiment results, so the
page can be regenerated whenever the results change.

## Structure

    index.html                    the page (hero, abstract, method, results tabs, BibTeX)
    static/css/results.css        styles for the results sections (template CSS unchanged)
    static/js/index.js            draws every chart from the data files
    static/js/plotly-2.35.2.min.js  Plotly, bundled so the page needs no chart CDN
    static/data/results.js        all results (written by export_site_data.py)
    static/data/embeddings.js     representation-space views (written with --embeddings)
    static/images/overview.png    method figure

## Regenerate the data from your final results (required before publishing)

The data shipped in this folder is a **preview** from preliminary result files; the page shows a yellow banner
until it is regenerated. From the code folder (`dtc/`), with the final results in `results/`:

    python export_site_data.py --res results --out <this folder>/static/data --embeddings

`--embeddings` recomputes, for each dataset, one client's nodes before and after a node-level request (a few
minutes). Without it, only `results.js` is rewritten. To use an archived run:
`--res archive/final-seeds42_<time>/results`.

What each tab reads:

| Tab | Result files |
|---|---|
| Accuracy | page_bench.jsonl (+ baseline numbers reported in the AAAI submission, labelled as reported) |
| Exactness | page_bench, page_protected, robust, ablation, gates_privacy, channels |
| Forgetting | page_bench, robust (R6) |
| Why two gates | ablation (parts 1-3), channels |
| Robustness | robust (R1-R5, R10) |
| Scalability | page_bench timings, robust (R9), locality_cost |
| Privacy | page_protected, gates_privacy (exp C), privacy (exp A), dp_cost |
| Representation space | embeddings.js |
| Motivation | geom_diag |

A view whose file is missing says so instead of showing data.

## View locally

Open `index.html` in a browser (the data files are plain scripts, so no server is needed), or run
`python -m http.server` in this folder and open http://localhost:8000.

## Publish

GitHub Pages: push this folder to a repository and enable Pages (Settings -> Pages -> deploy from the main branch).
Fill in the TODO comments in `index.html` (title, authors, links, page URL).

**Double-blind review.** PoPETs reviewing is double-blind. Until the paper is accepted, keep the page private or
unlisted and without author names, or wait to publish; check the venue's policy on preprints and project pages.
