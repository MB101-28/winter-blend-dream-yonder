export const TILE = 16;
export const MAP_W = 72;
export const MAP_H = 52;
export const DAY_LEN = 360;

export type Dir = "down" | "up" | "left" | "right";
export type MapId = "over" | "in";

export type Effect =
  | { t: "item"; id: string; n: number }
  | { t: "take"; id: string; n: number }
  | { t: "flag"; k: string }
  | { t: "coin"; n: number }
  | { t: "lore"; id: string }
  | { t: "toast"; m: string }
  | { t: "rod" };

export type Choice = {
  id: string;
  label: string;
  effects: Effect[];
  say?: string;
  shop?: "cafe" | "wood";
};

export type Talk = { name: string; text: string; choices: Choice[] };

export type ItemDef = {
  id: string;
  name: string;
  blurb: string;
  cat: "forage" | "crop" | "fish" | "seed" | "furn" | "relic";
  sell: number;
  buy?: number;
};

export type PlotSave = { crop: string | null; stage: number; wateredOnDay: number };

export type FurnSave = {
  uid: string;
  item: string;
  tx: number;
  ty: number;
  bought: boolean;
};

export type SaveData = {
  version: 1;
  time: number;
  lastGrownDay: number;
  coins: number;
  x: number;
  y: number;
  dir: Dir;
  map: MapId;
  items: Record<string, number>;
  removed: Record<string, number>;
  plots: Record<string, PlotSave>;
  flags: Record<string, number>;
  discovered: string[];
  lore: string[];
  regions: string[];
  fish: Record<string, number>;
  furniture: FurnSave[];
  harvests: number;
  settings: { music: number; sfx: number };
};

export type PlotDef = {
  id: string;
  tx: number;
  ty: number;
  area: "home" | "extra" | "comm";
};

export type NodeDef = {
  id: string;
  item: string;
  x: number;
  y: number;
};

export type SpotDef = {
  id: string;
  x: number;
  y: number;
  kind: string;
};

export type NpcDef = {
  id: string;
  name: string;
  x: number;
  y: number;
  path: { x: number; y: number }[];
  look: NpcLook;
};

export type NpcLook = {
  hair: string;
  outfit: string;
  pants: string;
  skin: string;
  hat: "none" | "flower" | "cap" | "straw" | "hood" | "bun";
  beard?: boolean;
};

export type BuildingDef = {
  id: string;
  kind: "cottage" | "cafe" | "workshop" | "house" | "fountain";
  ax: number;
  ay: number;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  windows: { x: number; y: number }[];
};

export type TreeDef = { tx: number; ty: number; pine: boolean; seed: number };
export type RockDef = { tx: number; ty: number; seed: number };

export type World = {
  tiles: Uint8Array;
  solid: Uint8Array;
  trees: TreeDef[];
  rocks: RockDef[];
  buildings: BuildingDef[];
  nodes: NodeDef[];
  spots: SpotDef[];
  plots: PlotDef[];
  npcs: NpcDef[];
  lamps: { x: number; y: number }[];
  interiorSolid: Uint8Array;
};

export type QuestView = { id: string; title: string; desc: string; done: boolean };

export type ViewState = {
  screen: "title" | "play";
  panel:
    | "none"
    | "inventory"
    | "journal"
    | "map"
    | "book"
    | "settings"
    | "pause"
    | "shop"
    | "workshop"
    | "seeds"
    | "dialogue";
  hasSave: boolean;
  day: number;
  clock: string;
  phaseName: string;
  coins: number;
  location: string;
  prompt: string | null;
  toast: string | null;
  saved: boolean;
  dialogue: Talk | null;
  inv: { id: string; name: string; qty: number; blurb: string; cat: string; icon: string }[];
  selected: string | null;
  quests: QuestView[];
  bookTab: "forage" | "crop" | "fish" | "stories";
  book: { id: string; name: string; blurb: string; known: boolean; count: number }[];
  shopKind: "cafe" | "wood" | null;
  goods: { id: string; name: string; price: number }[];
  sellables: { id: string; name: string; price: number; qty: number }[];
  seeds: { id: string; name: string; qty: number }[];
  settings: { music: number; sfx: number };
  decorate: boolean;
  furnPick: string | null;
  fishing: boolean;
  fishZone: number;
  fishWidth: number;
  caught: number;
  regionCards: { name: string; blurb: string; known: boolean; here: boolean }[];
};
