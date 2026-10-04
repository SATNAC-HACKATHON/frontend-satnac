"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, ScaleControl, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatStamp } from "@/lib/npm/format";

export type MapSample = {
  id: string;
  t: string;
  siteId: string;
  cellId: string;
  lat: number;
  lng: number;
  result: string;
  download: number | null;
  rsrp: number | null;
  sinr?: number | null;
  latency?: number | null;
  city?: string;
};

const PASS = "#15803d";
const FAIL = "#be123c";

function Frame({ samples, boundsKey }: { samples: MapSample[]; boundsKey: string }) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
      if (samples.length === 0) return;
      const bounds = L.latLngBounds(samples.map((sample) => [sample.lat, sample.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    });
    return () => cancelAnimationFrame(frame);
    // boundsKey changes only when the plotted set changes. Selection must not refit the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, map]);

  return null;
}

function FlyTo({ sample }: { sample: MapSample | null }) {
  const map = useMap();

  useEffect(() => {
    if (!sample) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo([sample.lat, sample.lng], Math.max(map.getZoom(), 15), { duration: reduce ? 0 : 0.5 });
  }, [map, sample]);

  return null;
}

function markerColor(result: string) {
  return result === "pass" ? PASS : FAIL;
}

export function LeafletMap({
  samples,
  boundsKey,
  selectedId,
  onSelect,
}: {
  samples: MapSample[];
  boundsKey: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const passes = samples.filter((sample) => sample.result === "pass" && sample.id !== selectedId);
  const fails = samples.filter((sample) => sample.result !== "pass" && sample.id !== selectedId);
  const selected = samples.find((sample) => sample.id === selectedId) ?? null;
  const ordered = [...passes, ...fails, ...(selected ? [selected] : [])];

  return (
    <MapContainer
      center={[-26.204, 28.047]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ScaleControl imperial={false} position="bottomleft" />
      <Frame samples={samples} boundsKey={boundsKey} />
      <FlyTo sample={selected} />
      {ordered.map((sample) => {
        const failed = sample.result !== "pass";
        const active = sample.id === selectedId;
        return (
          <CircleMarker
            key={sample.id}
            center={[sample.lat, sample.lng]}
            radius={active ? 9 : failed ? 7 : 5}
            pathOptions={{
              color: active ? "#0f172a" : failed ? "#9f1239" : "#166534",
              weight: active ? 2 : 1,
              fillColor: markerColor(sample.result),
              fillOpacity: 0.92,
            }}
            eventHandlers={{ click: () => onSelect(sample.id) }}
          >
            <Popup>
              <div className="min-w-[11rem] font-sans">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: markerColor(sample.result) }}>
                  {failed ? "Failed" : "Passed"}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{sample.cellId}</div>
                <div className="text-xs text-slate-500">
                  {sample.city ? `${sample.city} · ` : ""}
                  {formatStamp(sample.t)}
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-600">
                  <dt>Download</dt>
                  <dd className="font-mono text-slate-950">{sample.download == null ? "—" : `${sample.download.toFixed(1)} Mbps`}</dd>
                  <dt>Latency</dt>
                  <dd className="font-mono text-slate-950">{sample.latency == null ? "—" : `${sample.latency.toFixed(0)} ms`}</dd>
                  <dt>SINR</dt>
                  <dd className="font-mono text-slate-950">{sample.sinr == null ? "—" : `${sample.sinr.toFixed(1)} dB`}</dd>
                </dl>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
