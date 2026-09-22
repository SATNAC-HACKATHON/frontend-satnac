# NPM Desk

Next.js desk for the SATNAC Topic 5 proof of concept: AI-assisted Network Performance Management decision support.

The engineer view is built around one rule from the challenge: observed facts, AI inferences, and recommendations stay visually separate. The desk does not apply a network change.

## Scenario

Synthetic Telkom LTE cell degradation at `JHB-CBD-003-B` on 15 Sep 2026. The pipeline’s leading cause is transport backhaul congestion after a microwave protection-path change. Data and model outputs live in the sibling `backend-machineL` repo.

## Run

```powershell
npm install
npm run dev
```

Refresh the snapshot after the backend datasets or pipeline outputs change:

```powershell
npm run snapshot
```

That reads `../backend-machineL/data` and rewrites `lib/data/npm-snapshot.json`.

## Where the work lives

| Screen | Challenge piece |
| --- | --- |
| Challenge brief | Problem framing, pipeline phases, source list |
| Overview | The one significant issue against the rest of the estate |
| Incidents | Prioritised queue, with stable cells left unopened |
| Incident investigation | Facts, ranked causes, recommendation, timeline, supporting rows |
| Signals | Deterioration against each cell’s baseline |
| Alarms | Duplicate group versus background noise |
| Evidence | KPIs, alarms, complaints, drive tests, topology |
| Benefit | Time and noise estimates, plus what still needs an engineer study |

The incident page also lists where the scenario summary and the pipeline cluster disagree, so those numbers are not merged.
