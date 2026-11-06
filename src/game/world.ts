import {
  MAP_H,
  MAP_W,
  TILE,
  type BuildingDef,
  type NpcDef,
  type NodeDef,
  type PlotDef,
  type World,
} from "./types";

export const IW = 18;
export const IH = 13;

const GRASS = 0;
const PATH = 1;
const WATER = 2;
const SAND = 3;
const COBBLE = 4;
const FOREST = 5;
const SOIL = 6;
const DOCK = 7;

export const PLOTS: PlotDef[] = [
  { id: "h1", tx: 4, ty: 24, area: "home" },
  { id: "h2", tx: 6, ty: 24, area: "home" },
  { id: "h3", tx: 8, ty: 24, area: "home" },
  { id: "h4", tx: 12, ty: 24, area: "home" },
  { id: "e1", tx: 4, ty: 26, area: "extra" },
  { id: "e2", tx: 6, ty: 26, area: "extra" },
  { id: "e3", tx: 8, ty: 26, area: "extra" },
  { id: "e4", tx: 12, ty: 26, area: "extra" },
  { id: "c1", tx: 18, ty: 36, area: "comm" },
  { id: "c2", tx: 20, ty: 36, area: "comm" },
  { id: "c3", tx: 22, ty: 36, area: "comm" },
  { id: "c4", tx: 24, ty: 36, area: "comm" },
];

function hash(x: number, y: number, salt = 0): number {
  let n = Math.imul(x + salt * 17, 374761393) + Math.imul(y + 11, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function idx(x: number, y: number): number {
  return y * MAP_W + x;
}

function inside(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

export function buildWorld(): World {
  const tiles = new Uint8Array(MAP_W * MAP_H);
  const solid = new Uint8Array(MAP_W * MAP_H);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) tiles[idx(x, y)] = y < 16 ? FOREST : GRASS;
  }

  const stamp = (cx: number, cy: number, rx: number, ry: number, tile: number, hard = false) => {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        if (!inside(x, y)) continue;
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          tiles[idx(x, y)] = tile;
          if (hard) solid[idx(x, y)] = 1;
        }
      }
    }
  };

  stamp(60, 34, 12, 13, WATER, true);
  stamp(40, 8, 2.4, 2.1, WATER, true);

  const river = [
    [46, 4],
    [48, 8],
    [50, 14],
    [52, 20],
    [54, 26],
  ];
  for (let i = 0; i < river.length - 1; i++) {
    const a = river[i]!;
    const b = river[i + 1]!;
    for (let t = 0; t <= 1; t += 0.05) {
      stamp(a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t, 1.15, 1.15, WATER, true);
    }
  }

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (tiles[idx(x, y)] === WATER) continue;
      let shore = false;
      for (let oy = -1; oy <= 1 && !shore; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (inside(x + ox, y + oy) && tiles[idx(x + ox, y + oy)] === WATER) shore = true;
        }
      }
      if (shore && y > 28) tiles[idx(x, y)] = SAND;
    }
  }

  const polyline = (pts: number[][], tile: number, r = 1.05) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      for (let t = 0; t <= 1; t += 0.04) {
        const x = a[0]! + (b[0]! - a[0]!) * t;
        const y = a[1]! + (b[1]! - a[1]!) * t;
        for (let oy = -2; oy <= 2; oy++) {
          for (let ox = -2; ox <= 2; ox++) {
            const tx = Math.round(x + ox * 0.2);
            const ty = Math.round(y + oy * 0.2);
            if (!inside(tx, ty)) continue;
            const d = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
            if (d > r) continue;
            if (tiles[idx(tx, ty)] === WATER) continue;
            tiles[idx(tx, ty)] = tile;
            solid[idx(tx, ty)] = 0;
          }
        }
      }
    }
  };

  polyline(
    [
      [10, 21],
      [10, 30],
      [24, 30],
      [32, 28],
      [46, 34],
    ],
    PATH,
  );
  polyline(
    [
      [28, 28],
      [28, 18],
      [22, 12],
      [16, 8],
    ],
    PATH,
  );
  polyline(
    [
      [20, 32],
      [16, 40],
      [22, 46],
    ],
    PATH,
  );
  polyline(
    [
      [32, 30],
      [38, 36],
      [34, 44],
    ],
    PATH,
    0.8,
  );

  for (let y = 22; y <= 33; y++) {
    for (let x = 22; x <= 40; x++) {
      if (tiles[idx(x, y)] === WATER) continue;
      if (tiles[idx(x, y)] === PATH || hash(x, y, 4) > 0.25) {
        tiles[idx(x, y)] = COBBLE;
        solid[idx(x, y)] = 0;
      }
    }
  }

  for (const p of PLOTS) {
    if (inside(p.tx, p.ty)) {
      tiles[idx(p.tx, p.ty)] = SOIL;
      solid[idx(p.tx, p.ty)] = 0;
    }
  }

  for (let x = 46; x <= 56; x++) {
    for (const y of [33, 34]) {
      if (!inside(x, y)) continue;
      tiles[idx(x, y)] = DOCK;
      solid[idx(x, y)] = 0;
    }
  }

  const blockedRect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!inside(x, y)) continue;
        solid[idx(x, y)] = 1;
        if (tiles[idx(x, y)] === WATER) continue;
      }
    }
  };

  const buildings: BuildingDef[] = [
    {
      id: "cottage",
      kind: "cottage",
      tx: 7,
      ty: 17,
      tw: 6,
      th: 4,
      ax: 10 * TILE + 8,
      ay: 21 * TILE,
      windows: [
        { x: 8 * TILE + 4, y: 18 * TILE },
        { x: 11 * TILE + 4, y: 18 * TILE },
      ],
    },
    {
      id: "workshop",
      kind: "workshop",
      tx: 20,
      ty: 19,
      tw: 5,
      th: 4,
      ax: 22 * TILE + 8,
      ay: 23 * TILE,
      windows: [{ x: 21 * TILE, y: 20 * TILE }],
    },
    {
      id: "cafe",
      kind: "cafe",
      tx: 33,
      ty: 19,
      tw: 6,
      th: 4,
      ax: 36 * TILE,
      ay: 23 * TILE,
      windows: [
        { x: 34 * TILE, y: 20 * TILE },
        { x: 37 * TILE, y: 20 * TILE },
      ],
    },
    {
      id: "house",
      kind: "house",
      tx: 40,
      ty: 24,
      tw: 4,
      th: 3,
      ax: 42 * TILE,
      ay: 27 * TILE,
      windows: [{ x: 41 * TILE, y: 25 * TILE }],
    },
    {
      id: "fountain",
      kind: "fountain",
      tx: 29,
      ty: 26,
      tw: 3,
      th: 3,
      ax: 30 * TILE + 8,
      ay: 29 * TILE,
      windows: [],
    },
  ];

  for (const b of buildings) {
    for (let y = b.ty; y < b.ty + b.th; y++) {
      for (let x = b.tx; x < b.tx + b.tw; x++) {
        if (!inside(x, y)) continue;
        solid[idx(x, y)] = 1;
        if (tiles[idx(x, y)] === WATER) tiles[idx(x, y)] = COBBLE;
      }
    }
  }

  const trees: World["trees"] = [];
  const nearTree = (tx: number, ty: number) => trees.some((t) => Math.abs(t.tx - tx) <= 1 && Math.abs(t.ty - ty) <= 1);
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      const tile = tiles[idx(x, y)];
      const forest = tile === FOREST;
      const edge = tile === GRASS && (y < 3 || x < 2 || x > MAP_W - 3 || hash(x, y, 5) > 0.94);
      if (!forest && !edge) continue;
      if (solid[idx(x, y)]) continue;
      if (x >= 4 && x <= 16 && y >= 15 && y <= 32) continue;
      if (x >= 18 && x <= 44 && y >= 17 && y <= 35) continue;
      if (hash(x, y, 7) < (forest ? 0.72 : 0.9)) continue;
      if (nearTree(x, y)) continue;
      const clearing = Math.hypot(x - 16, y - 7) < 4.2;
      const pond = Math.hypot(x - 40, y - 8) < 3.2;
      if (clearing || pond) continue;
      trees.push({ tx: x, ty: y, pine: hash(x, y, 8) > 0.55, seed: Math.floor(hash(x, y, 9) * 8) });
      solid[idx(x, y)] = 1;
    }
  }

  const rocks: World["rocks"] = [];
  for (let y = 2; y < MAP_H - 1; y++) {
    for (let x = 2; x < MAP_W - 1; x++) {
      if (solid[idx(x, y)]) continue;
      const tile = tiles[idx(x, y)];
      if (tile !== FOREST && tile !== GRASS) continue;
      if (hash(x, y, 11) < 0.985) continue;
      rocks.push({ tx: x, ty: y, seed: Math.floor(hash(x, y, 12) * 4) });
      solid[idx(x, y)] = 1;
      if (rocks.length > 16) break;
    }
  }

  const nodes: NodeDef[] = [];
  const pushNode = (item: string, tx: number, ty: number) => {
    if (!inside(tx, ty) || solid[idx(tx, ty)]) return;
    const tile = tiles[idx(tx, ty)];
    if (tile === WATER || tile === DOCK || tile === PATH || tile === SOIL) return;
    const id = `${item}-${tx}-${ty}`;
    if (nodes.some((n) => Math.hypot(n.x - (tx * TILE + 8), n.y - (ty * TILE + 10)) < 28)) return;
    nodes.push({ id, item, x: tx * TILE + 8, y: ty * TILE + 10 });
  };

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const h = hash(x, y, 15);
      if (y > 39 && x < 40 && tiles[idx(x, y)] === GRASS && h > 0.86) pushNode(h > 0.94 ? "poppy" : "daisy", x, y);
      else if (y > 18 && y < 36 && x > 16 && tiles[idx(x, y)] === GRASS && h > 0.93) pushNode("tulip", x, y);
      else if (tiles[idx(x, y)] === FOREST && h > 0.94) pushNode(h > 0.975 ? "mushroom" : "berry", x, y);
      else if (tiles[idx(x, y)] === FOREST && hash(x, y, 16) > 0.988) pushNode("wood", x, y);
      else if ((tiles[idx(x, y)] === GRASS || tiles[idx(x, y)] === SAND) && hash(x, y, 17) > 0.992) pushNode("stone", x, y);
      else if (tiles[idx(x, y)] === FOREST && hash(x, y, 18) > 0.99) pushNode("herb", x, y);
    }
  }
  pushNode("feather", 8, 43);
  pushNode("shell", 58, 46);
  pushNode("mushroom", 15, 6);
  pushNode("mushroom", 17, 8);
  pushNode("mushroom", 14, 8);

  const spot = (id: string, tx: number, ty: number, kind: string) => ({ id, x: tx * TILE + 8, y: ty * TILE + 8, kind });
  const spots = [
    spot("door", 10, 21, "door"),
    spot("cafe", 36, 24, "cafe"),
    spot("workshop", 22, 24, "workshop"),
    spot("notice", 26, 33, "notice"),
    spot("fence", 15, 28, "fence"),
    spot("shrine", 16, 7, "shrine"),
    spot("carving", 40, 10, "carving"),
    spot("nest", 12, 44, "nest"),
    spot("fish1", 50, 34, "fish"),
    spot("fish2", 54, 34, "fish"),
    spot("fish3", 38, 9, "fish"),
  ];

  const npcs: NpcDef[] = [
    {
      id: "lior",
      name: "Elder Lior",
      x: 27 * TILE,
      y: 29 * TILE,
      path: [
        { x: 26 * TILE, y: 29 * TILE },
        { x: 33 * TILE, y: 29 * TILE },
        { x: 32 * TILE, y: 32 * TILE },
        { x: 26 * TILE, y: 32 * TILE },
      ],
      look: { hair: "#d9d3c7", outfit: "#3c4d86", pants: "#2c3558", skin: "#e7c2a4", hat: "hood" },
    },
    {
      id: "mira",
      name: "Mira Bloom",
      x: 20 * TILE,
      y: 38 * TILE,
      path: [
        { x: 18 * TILE, y: 38 * TILE },
        { x: 26 * TILE, y: 38 * TILE },
        { x: 24 * TILE, y: 34 * TILE },
      ],
      look: { hair: "#a24b2a", outfit: "#6e9a55", pants: "#415c38", skin: "#f0c7a6", hat: "flower" },
    },
    {
      id: "tomas",
      name: "Tomas Reed",
      x: 24 * TILE,
      y: 24 * TILE,
      path: [
        { x: 24 * TILE, y: 24 * TILE },
        { x: 27 * TILE, y: 25 * TILE },
        { x: 23 * TILE, y: 27 * TILE },
      ],
      look: { hair: "#5a3a28", outfit: "#c47a3a", pants: "#4a3a30", skin: "#e0b898", hat: "cap", beard: true },
    },
    {
      id: "hana",
      name: "Hana Sol",
      x: 37 * TILE,
      y: 25 * TILE,
      path: [
        { x: 34 * TILE, y: 25 * TILE },
        { x: 39 * TILE, y: 26 * TILE },
        { x: 36 * TILE, y: 28 * TILE },
      ],
      look: { hair: "#3a2418", outfit: "#f0e2c4", pants: "#8a4a3a", skin: "#e8be9a", hat: "bun" },
    },
    {
      id: "sable",
      name: "Sable Quill",
      x: 26 * TILE,
      y: 34 * TILE,
      path: [
        { x: 25 * TILE, y: 33 * TILE },
        { x: 30 * TILE, y: 34 * TILE },
        { x: 27 * TILE, y: 36 * TILE },
      ],
      look: { hair: "#241816", outfit: "#d7a15a", pants: "#3e342c", skin: "#f2c8aa", hat: "none" },
    },
    {
      id: "bram",
      name: "Bram Oak",
      x: 52 * TILE,
      y: 34 * TILE,
      path: [
        { x: 49 * TILE, y: 34 * TILE },
        { x: 55 * TILE, y: 34 * TILE },
      ],
      look: { hair: "#6a5030", outfit: "#3d7eb5", pants: "#2d4a62", skin: "#e6c09a", hat: "straw" },
    },
  ];

  const lamps = [
    { x: 10 * TILE + 8, y: 26 * TILE },
    { x: 18 * TILE, y: 30 * TILE },
    { x: 30 * TILE, y: 24 * TILE },
    { x: 44 * TILE, y: 32 * TILE },
    { x: 16 * TILE, y: 42 * TILE },
    { x: 16 * TILE, y: 10 * TILE },
  ];

  const interiorSolid = new Uint8Array(IW * IH);
  for (let y = 0; y < IH; y++) {
    for (let x = 0; x < IW; x++) {
      if (x === 0 || y === 0 || x === IW - 1 || y === IH - 1) interiorSolid[y * IW + x] = 1;
    }
  }

  blockedRect(0, 0, -1, -1);
  return { tiles, solid, trees, rocks, buildings, nodes, spots, plots: PLOTS, npcs, lamps, interiorSolid };
}

export function tileAt(world: World, tx: number, ty: number): number {
  if (!inside(tx, ty)) return WATER;
  return world.tiles[idx(tx, ty)] ?? GRASS;
}

export function isWaterish(tile: number): boolean {
  return tile === WATER;
}

export function regionName(px: number, py: number, map: "over" | "in"): string {
  if (map === "in") return "Rowan Cottage";
  const x = px / TILE;
  const y = py / TILE;
  if (Math.hypot(x - 16, y - 7) < 5) return "Lantern Clearing";
  if (y < 16 && x < 50) return "Pinewhisper Forest";
  if (x > 46) return "Lantern Lake";
  if (y > 38 && x < 42) return "Buttercup Meadow";
  if (x < 17) return "Cottage Garden";
  return "Little Lantern Village";
}

export { GRASS, PATH, WATER, SAND, COBBLE, FOREST, SOIL, DOCK };
