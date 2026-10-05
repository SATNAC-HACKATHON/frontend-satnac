# NPM Desk

Next.js desk for the SATNAC Topic 5 proof of concept: AI-assisted Network Performance Management.

The desk shows one synthetic Telkom incident at cell `JHB-CBD-003-B`. Observed facts, model inferences, and the recommended next step stay separate. It does not change the network.

## What you need

- Node.js 20.9 or newer, with npm
- Python 3, only if you refresh the data snapshot. The snapshot script uses the Python standard library, so there is nothing to `pip install`
- The sibling repo `backend-machineL`, only if you refresh the snapshot. The desk already includes a snapshot and can start without it

Keep the two repos side by side:

```text
SATNAC-HACK/
  backend-machineL/
  frontend-satnac/
```

## Run the desk

From this folder:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Refresh the data

The screens read `lib/data/npm-snapshot.json`, which is built from `backend-machineL/data`. After the backend datasets or pipeline outputs change, rebuild it from this folder:

```powershell
npm run snapshot
```

On Windows that runs `py -3 scripts/build-snapshot.py`. On macOS or Linux, run:

```bash
python3 scripts/build-snapshot.py
```

The script expects `../backend-machineL/data`. If that folder is missing, it stops and names the path it looked for.

## Production build

```powershell
npm run build
npm start
```

`npm start` serves the built app on [http://localhost:3000](http://localhost:3000).

## Screens

| Screen | What it shows |
| --- | --- |
| Challenge brief | Problem framing and pipeline phases |
| Overview | The degraded cell against the rest of the estate |
| Incidents | Queue of issues the pipeline promoted |
| Incident investigation | Facts, ranked causes, recommendation, timeline |
| Signals | Each cell against its baseline |
| Alarms | Duplicate group versus background alarms |
| Evidence | KPIs, alarms, complaints, drive tests, topology |
| Benefit | Time and noise estimates for this scenario |
