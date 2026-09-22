import snapshotJson from "@/lib/data/npm-snapshot.json";
import type { NpmSnapshot } from "@/lib/types/npm";

export const snapshot = snapshotJson as unknown as NpmSnapshot;
