import { DAY_LEN, TILE, type PlotDef, type SaveData } from "./types";

export const SAVE_KEY = "little-lantern-village-save-v1";
const BAK_KEY = "little-lantern-village-save-bak";

export function defaultSave(plots: PlotDef[]): SaveData {
  const plotState: SaveData["plots"] = {};
  for (const p of plots) plotState[p.id] = { crop: null, stage: 0, wateredOnDay: 0 };
  return {
    version: 1,
    time: 0.32 * DAY_LEN,
    lastGrownDay: 1,
    coins: 40,
    x: 10 * TILE + 8,
    y: 22 * TILE + 10,
    dir: "down",
    map: "over",
    items: { seed_daisy: 3, seed_turnip: 2 },
    removed: {},
    plots: plotState,
    flags: {},
    discovered: ["seed_daisy", "seed_turnip"],
    lore: ["letter"],
    regions: ["Cottage Garden"],
    fish: {},
    furniture: [
      { uid: "bed", item: "furn_bed", tx: 2, ty: 2, bought: false },
      { uid: "stove", item: "furn_stove", tx: 14, ty: 2, bought: false },
      { uid: "chest", item: "furn_chest", tx: 14, ty: 7, bought: false },
      { uid: "rug", item: "furn_rug", tx: 7, ty: 5, bought: false },
    ],
    harvests: 0,
    settings: { music: 70, sfx: 80 },
  };
}

export function hasSave(): boolean {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSave(save: SaveData): boolean {
  try {
    const prev = localStorage.getItem(SAVE_KEY);
    if (prev) localStorage.setItem(BAK_KEY, prev);
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function hydrateSave(raw: SaveData, plots: PlotDef[]): SaveData {
  const base = defaultSave(plots);
  const mergedPlots = { ...base.plots };
  for (const [id, plot] of Object.entries(raw.plots ?? {})) mergedPlots[id] = plot;
  return {
    ...base,
    ...raw,
    version: 1,
    items: raw.items ?? {},
    plots: mergedPlots,
    flags: raw.flags ?? {},
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    furniture: raw.furniture?.length ? raw.furniture : base.furniture,
    discovered: raw.discovered ?? base.discovered,
    lore: raw.lore?.length ? raw.lore : base.lore,
    regions: raw.regions?.length ? raw.regions : base.regions,
    fish: raw.fish ?? {},
    removed: raw.removed ?? {},
  };
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* private mode */
  }
}
