"""Build the frontend snapshot from backend-machineL datasets.

Reads the synthetic Telkom cell-degradation CSVs and pipeline outputs, then
writes lib/data/npm-snapshot.json. The console renders this file so the UI
stays aligned with the model artifacts without bundling every raw row.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT.parent / "backend-machineL"
DATA = BACKEND / "data"
OUT = ROOT / "lib" / "data" / "npm-snapshot.json"


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def num(value: str | None, places: int = 2) -> float | None:
    if value is None or value == "":
        return None
    return round(float(value), places)


def flag(value: str | None) -> bool:
    return (value or "").strip().lower() in {"true", "1", "yes"}


def bullets(markdown: str, heading: str) -> list[str]:
    lines = markdown.splitlines()
    collecting = False
    found: list[str] = []
    for line in lines:
        if line.startswith("#### "):
            if collecting:
                break
            collecting = line.replace("#### ", "", 1).strip() == heading
            continue
        if collecting and line.startswith("- "):
            found.append(line[2:].strip())
    return found


def main() -> None:
    if not DATA.exists():
        raise SystemExit(f"Backend data folder not found: {DATA}")

    manifest = json.loads((DATA / "dataset_manifest.json").read_text(encoding="utf-8"))
    rca = json.loads((DATA / "processed" / "rca_report.json").read_text(encoding="utf-8"))
    clusters = json.loads((DATA / "processed" / "incident_clusters.json").read_text(encoding="utf-8"))
    report = (DATA / "processed" / "engineer_report.md").read_text(encoding="utf-8")
    summary_rows = load_csv(DATA / "processed" / "telkom_cell_degradation_incident_summary.csv")
    kpis = load_csv(DATA / "raw" / "telkom_network_kpis.csv")
    counters = load_csv(DATA / "raw" / "telkom_performance_counters.csv")
    alarms = load_csv(DATA / "raw" / "telkom_alarms.csv")
    complaints = load_csv(DATA / "raw" / "telkom_customer_complaints.csv")
    drive_tests = load_csv(DATA / "raw" / "telkom_drive_test_logs.csv")
    topology = load_csv(DATA / "raw" / "telkom_topology_config_change_logs.csv")

    summary = summary_rows[0]
    cluster_alarm_ids = {item["cluster_id"]: {row["alarm_id"] for row in item["alarms"]} for item in clusters}
    cluster_complaint_ids = {item["cluster_id"]: {row["ticket_id"] for row in item["complaints"]} for item in clusters}
    cluster_drive_ids = {item["cluster_id"]: {row["drive_test_id"] for row in item["drive_tests"]} for item in clusters}
    cluster_topology_ids = {item["cluster_id"]: {row["event_id"] for row in item["topology_changes"]} for item in clusters}

    all_cluster_alarms = set().union(*cluster_alarm_ids.values())
    all_cluster_complaints = set().union(*cluster_complaint_ids.values())
    all_cluster_drives = set().union(*cluster_drive_ids.values())
    all_cluster_topology = set().union(*cluster_topology_ids.values())

    counter_index = {
        (row["timestamp"], row["cell_id"]): row
        for row in counters
    }

    cells: dict[str, dict] = {}
    series: dict[str, list] = {}
    for row in kpis:
        cell_id = row["cell_id"]
        counter = counter_index.get((row["timestamp"], cell_id), {})
        point = [
            row["timestamp"],
            num(row["accessibility_pct"]),
            num(row["dl_throughput_mbps"]),
            num(row["latency_ms"]),
            num(row["prb_utilization_pct"]),
            num(row["anomaly_score"], 3),
            num(row["drop_call_rate_pct"]),
            num(counter.get("packet_loss_pct")),
            num(counter.get("transport_discard_packets"), 0),
            num(counter.get("rrc_connection_failures"), 0),
            num(counter.get("erab_setup_failures"), 0),
        ]
        series.setdefault(cell_id, []).append(point)

        bucket = cells.setdefault(
            cell_id,
            {
                "cellId": cell_id,
                "siteId": row["site_id"],
                "city": row["city"],
                "region": row["region"],
                "band": row["rat_band"],
                "samples": 0,
                "degradedSamples": 0,
                "maxAnomaly": 0,
                "minAccessibility": 100,
                "minThroughput": 10_000,
            },
        )
        bucket["samples"] += 1
        if row["degradation_label"] != "normal":
            bucket["degradedSamples"] += 1
        anomaly = float(row["anomaly_score"])
        bucket["maxAnomaly"] = round(max(bucket["maxAnomaly"], anomaly), 3)
        bucket["minAccessibility"] = round(min(bucket["minAccessibility"], float(row["accessibility_pct"])), 2)
        bucket["minThroughput"] = round(min(bucket["minThroughput"], float(row["dl_throughput_mbps"])), 2)

    for bucket in cells.values():
        bucket["status"] = "degraded" if bucket["degradedSamples"] else "stable"

    features = load_csv(DATA / "processed" / "cell_window_features.csv")
    baselines: dict[str, list] = {}
    for row in features:
        baselines.setdefault(row["cell_id"], []).append(
            [
                row["timestamp"],
                num(row["baseline_accessibility_pct"]),
                num(row["baseline_dl_throughput_mbps"]),
            ]
        )

    detections = []
    for row in load_csv(DATA / "processed" / "detected_degradations.csv"):
        detections.append(
            {
                "t": row["timestamp"],
                "cellId": row["cell_id"],
                "siteId": row["site_id"],
                "score": num(row["detection_score"]),
                "severity": row["detected_severity"],
                "issue": row["detected_issue"],
                "accessibility": num(row["accessibility_pct"]),
                "baselineAccessibility": num(row["baseline_accessibility_pct"]),
                "throughput": num(row["dl_throughput_mbps"]),
                "baselineThroughput": num(row["baseline_dl_throughput_mbps"]),
                "packetLoss": num(row["packet_loss_pct"]),
                "discards": num(row["transport_discard_packets"], 0),
                "latency": num(row["latency_ms"]),
            }
        )

    def membership(record_id: str, groups: dict[str, set[str]]) -> list[str]:
        return [cluster_id for cluster_id, ids in groups.items() if record_id in ids]

    alarm_rows = []
    for row in alarms:
        alarm_rows.append(
            {
                "id": row["alarm_id"],
                "raised": row["raised_timestamp"],
                "cleared": row["cleared_timestamp"],
                "siteId": row["site_id"],
                "cellId": row["cell_id"],
                "domain": row["domain"],
                "severity": row["severity"],
                "code": row["alarm_code"],
                "description": row["description"],
                "probableCause": row["probable_cause"],
                "duplicateGroup": row["duplicate_group_id"],
                "correlated": flag(row["is_duplicate_or_correlated"]),
                "incidentId": row["incident_id"],
                "clusters": membership(row["alarm_id"], cluster_alarm_ids),
            }
        )

    complaint_rows = []
    for row in complaints:
        if row["ticket_id"] not in all_cluster_complaints and not row["incident_id"]:
            continue
        complaint_rows.append(
            {
                "id": row["ticket_id"],
                "opened": row["opened_timestamp"],
                "siteId": row["site_id"],
                "cellId": row["cell_id"],
                "area": row["city_area"],
                "classification": row["ticket_classification"],
                "priority": row["priority"],
                "impact": row["customer_impact"],
                "slaMinutes": int(float(row["sla_resolution_minutes"])),
                "sentiment": num(row["sentiment_score"], 2),
                "incidentId": row["incident_id"],
                "clusters": membership(row["ticket_id"], cluster_complaint_ids),
            }
        )

    geo_samples = []
    for row in drive_tests:
        lat = num(row["latitude"], 6)
        lng = num(row["longitude"], 6)
        if lat is None or lng is None:
            continue
        cell = cells.get(row["serving_cell_id"], {})
        geo_samples.append(
            {
                "id": row["drive_test_id"],
                "t": row["timestamp"],
                "siteId": row["site_id"],
                "cellId": row["serving_cell_id"],
                "city": cell.get("city", ""),
                "lat": lat,
                "lng": lng,
                "rsrp": num(row["rsrp_dbm"]),
                "sinr": num(row["sinr_db"]),
                "latency": num(row["ping_latency_ms"], 0),
                "download": num(row["download_mbps"]),
                "result": row["test_result"],
                "clusters": membership(row["drive_test_id"], cluster_drive_ids),
            }
        )

    drive_rows = []
    for row in drive_tests:
        if row["drive_test_id"] not in all_cluster_drives:
            continue
        drive_rows.append(
            {
                "id": row["drive_test_id"],
                "t": row["timestamp"],
                "siteId": row["site_id"],
                "cellId": row["serving_cell_id"],
                "lat": num(row["latitude"], 6),
                "lng": num(row["longitude"], 6),
                "rsrp": num(row["rsrp_dbm"]),
                "rsrq": num(row["rsrq_db"]),
                "sinr": num(row["sinr_db"]),
                "latency": num(row["ping_latency_ms"]),
                "download": num(row["download_mbps"]),
                "upload": num(row["upload_mbps"]),
                "result": row["test_result"],
                "incidentId": row["incident_id"],
                "clusters": membership(row["drive_test_id"], cluster_drive_ids),
            }
        )

    topology_rows = []
    for row in topology:
        topology_rows.append(
            {
                "id": row["event_id"],
                "t": row["timestamp"],
                "siteId": row["site_id"],
                "cellId": row["cell_id"],
                "domain": row["domain"],
                "eventType": row["event_type"],
                "objectName": row["object_name"],
                "summary": row["change_summary"],
                "changedBy": row["changed_by"],
                "parent": row["topology_parent"],
                "azimuth": num(row["azimuth_deg"], 1),
                "mechanicalTilt": num(row["mechanical_tilt_deg"], 1),
                "electricalTilt": num(row["electrical_tilt_deg"], 1),
                "incidentId": row["incident_id"],
                "clusters": membership(row["event_id"], cluster_topology_ids),
            }
        )

    pipeline_clusters = []
    for item, cause in zip(clusters, rca):
        pipeline_clusters.append(
            {
                "clusterId": item["cluster_id"],
                "siteId": item["site_id"],
                "cellId": item["cell_id"],
                "start": item["start_timestamp"],
                "end": item["end_timestamp"],
                "rawEventCount": item["raw_event_count"],
                "alarmCount": len(item["alarms"]),
                "complaintCount": len(item["complaints"]),
                "driveTestCount": len(item["drive_tests"]),
                "topologyCount": len(item["topology_changes"]),
                "detectionCount": len(item["detections"]),
                "predictedRootCause": cause["predicted_root_cause"],
                "confidence": cause["confidence_score"],
                "rankedCandidates": [
                    {
                        "rootCause": candidate["root_cause"],
                        "score": candidate["score"],
                        "evidence": candidate["evidence"],
                    }
                    for candidate in cause["ranked_candidates"]
                ],
            }
        )

    snapshot = {
        "seriesFields": [
            "t",
            "accessibility",
            "throughput",
            "latency",
            "prb",
            "anomaly",
            "dropRate",
            "packetLoss",
            "discards",
            "rrcFailures",
            "erabFailures",
        ],
        "baselineFields": ["t", "accessibility", "throughput"],
        "manifest": {
            "datasetName": manifest["dataset_name"],
            "seed": manifest["seed"],
            "scenario": manifest["scenario"],
            "start": manifest["date_range"]["start"],
            "end": manifest["date_range"]["end"],
            "rowCounts": manifest["row_counts"],
            "sourceNote": manifest["source_note"],
        },
        "summary": {
            "incidentId": summary["incident_id"],
            "operator": summary["operator"],
            "scenario": summary["scenario"],
            "siteId": summary["site_id"],
            "cellId": summary["primary_cell_id"],
            "start": summary["start_timestamp"],
            "end": summary["end_timestamp"],
            "severity": summary["severity"],
            "domain": summary["affected_domain"],
            "rawEventsClustered": int(summary["raw_events_clustered"]),
            "duplicateSuppressedPct": num(summary["duplicate_alarms_suppressed_pct"]),
            "manualMinutes": int(summary["estimated_manual_investigation_minutes"]),
            "assistedMinutes": int(summary["estimated_ai_assisted_investigation_minutes"]),
            "savedMinutes": int(summary["estimated_time_saved_minutes"]),
            "observedFacts": summary["observed_facts"],
            "aiInference": summary["ai_inference"],
            "recommendation": summary["recommendation"],
            "confidence": num(summary["confidence_score"], 2),
        },
        "engineerReport": {
            "facts": bullets(report, "Facts"),
            "inference": bullets(report, "AI Inference"),
            "recommendation": bullets(report, "Recommendation"),
        },
        "clusters": pipeline_clusters,
        "cells": sorted(cells.values(), key=lambda item: (item["status"] != "degraded", item["cellId"])),
        "series": series,
        "baselines": baselines,
        "detections": detections,
        "alarms": alarm_rows,
        "complaints": complaint_rows,
        "driveTests": drive_rows,
        "geoSamples": geo_samples,
        "topology": topology_rows,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snapshot, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
