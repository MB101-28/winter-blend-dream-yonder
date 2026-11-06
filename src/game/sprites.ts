import type { Dir, NpcLook, World } from "./types";
import { MAP_H, MAP_W, TILE } from "./types";
import { COBBLE, DOCK, FOREST, GRASS, IH, IW, PATH, SAND, SOIL, WATER } from "./world";

export type Art = {
  terrain: HTMLCanvasElement;
  interior: HTMLCanvasElement;
  trees: HTMLCanvasElement[];
  pines: HTMLCanvasElement[];
  rocks: HTMLCanvasElement[];
  cottage: HTMLCanvasElement;
  cafe: HTMLCanvasElement;
  workshop: HTMLCanvasElement;
  house: HTMLCanvasElement;
  fountain: HTMLCanvasElement;
  hero: Record<Dir, [HTMLCanvasElement, HTMLCanvasElement]>;
  npcs: Record<string, [HTMLCanvasElement, HTMLCanvasElement]>;
  sheep: HTMLCanvasElement;
  duck: HTMLCanvasElement;
  cat: HTMLCanvasElement;
  plot: HTMLCanvasElement;
  crops: Record<string, HTMLCanvasElement[]>;
  nodes: Record<string, HTMLCanvasElement>;
  icons: Record<string, HTMLCanvasElement>;
  lamp: HTMLCanvasElement;
  fence: HTMLCanvasElement;
  fenceBroken: HTMLCanvasElement;
};

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  return [c, g];
}

function dot(g: CanvasRenderingContext2D, x: number, y: number, c: string) {
  g.fillStyle = c;
  g.fillRect(x | 0, y | 0, 1, 1);
}

function disc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string) {
  g.fillStyle = c;
  const R = r | 0;
  for (let y = -R; y <= R; y++) {
    const w = Math.floor(Math.sqrt(Math.max(0, R * R - y * y)));
    g.fillRect((cx | 0) - w, (cy | 0) + y, w * 2 + 1, 1);
  }
}

function blit(g: CanvasRenderingContext2D, rows: string[], ox: number, oy: number, pal: Record<string, string>) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y] ?? "";
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x] ?? ""];
      if (!col) continue;
      dot(g, ox + x, oy + y, col);
    }
  }
}

function makeTree(pine: boolean, seed: number): HTMLCanvasElement {
  const [c, g] = canvas(40, 48);
  disc(g, 20, 44, 8, "rgba(30,40,20,0.28)");
  g.fillStyle = "#6b4226";
  g.fillRect(18, 30, 5, 14);
  g.fillStyle = "#8d5a34";
  g.fillRect(18, 30, 2, 14);
  if (pine) {
    const greens = ["#1d6834", "#2f8a42", "#3ea250"];
    for (let i = 0; i < 3; i++) {
      const top = 4 + i * 8;
      const half = 14 - i * 2;
      g.fillStyle = greens[i] ?? "#2f8a42";
      for (let y = 0; y < 12; y++) {
        const w = Math.max(2, half - Math.floor((y / 12) * half));
        g.fillRect(20 - w, top + y, w * 2, 1);
      }
    }
    dot(g, 18, 8, "#d5f0b0");
  } else {
    const shift = seed % 3;
    disc(g, 20, 24, 12, "#226833");
    disc(g, 11 + shift, 22, 8, "#2f8a40");
    disc(g, 28 - shift, 21, 8, "#1c5c2e");
    disc(g, 18, 15, 8, "#3c9a48");
    disc(g, 24, 18, 5, "#67b85a");
    dot(g, 14, 14, "#e7f6c8");
    dot(g, 22, 12, "#f4fbe4");
    if (seed % 2 === 0) {
      dot(g, 26, 20, "#f2d2e4");
      dot(g, 12, 24, "#f7e7a0");
    }
  }
  return c;
}

function makeRock(seed: number): HTMLCanvasElement {
  const [c, g] = canvas(18, 14);
  disc(g, 9, 8, 7, seed % 2 ? "#b7aa9c" : "#9c9084");
  disc(g, 7, 7, 3, "#d9d0c4");
  dot(g, 11, 9, "#6e655c");
  return c;
}

function makeHouse(kind: "cottage" | "cafe" | "workshop" | "house"): HTMLCanvasElement {
  const [c, g] = canvas(78, 72);
  const wall = kind === "cafe" ? "#c9854a" : kind === "workshop" ? "#a56b3d" : kind === "house" ? "#8d6a4a" : "#a33b3c";
  const wallD = kind === "cottage" ? "#7c2c30" : "#6e4a2c";
  const roof = kind === "cafe" ? "#d08a3a" : kind === "workshop" ? "#6e5438" : "#d4653a";
  const roofD = "#a84828";
  g.fillStyle = "rgba(40,30,20,0.25)";
  g.fillRect(14, 64, 52, 5);
  g.fillStyle = wallD;
  g.fillRect(48, 36, 16, 28);
  g.fillStyle = wall;
  g.fillRect(16, 34, 40, 30);
  for (let y = 36; y < 62; y += 4) {
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.fillRect(16, y, 40, 1);
  }
  g.fillStyle = roof;
  for (let row = 0; row < 16; row++) {
    const inset = Math.floor(row * 0.7);
    g.fillStyle = row % 2 ? roof : roofD;
    g.fillRect(10 + inset, 8 + row, 58 - inset * 2, 1);
  }
  g.fillStyle = "#efe6d2";
  g.fillRect(18, 18, 42, 3);
  g.fillStyle = "#6b4226";
  g.fillRect(50, 6, 6, 12);
  g.fillStyle = "#4e3220";
  g.fillRect(48, 4, 10, 4);
  g.fillStyle = "#efe6d2";
  g.fillRect(31, 46, 12, 18);
  g.fillStyle = kind === "cafe" ? "#7d9a62" : "#3f8d45";
  g.fillRect(33, 48, 8, 14);
  g.fillStyle = "#f4e27a";
  g.fillRect(22, 40, 8, 8);
  g.fillRect(48, 40, 8, 8);
  g.fillStyle = "#9fd7f2";
  g.fillRect(23, 41, 6, 6);
  g.fillRect(49, 41, 6, 6);
  g.fillStyle = wallD;
  g.fillRect(25, 43, 1, 6);
  g.fillRect(51, 43, 1, 6);
  if (kind === "cafe") {
    g.fillStyle = "#f2f6ea";
    g.fillRect(18, 58, 4, 4);
    dot(g, 19, 57, "#f7e27a");
  }
  if (kind === "cottage") {
    g.fillStyle = "#6b4226";
    g.fillRect(14, 60, 10, 4);
    dot(g, 16, 59, "#e07070");
    dot(g, 19, 59, "#f2f6ea");
  }
  return c;
}

function makeFountain(): HTMLCanvasElement {
  const [c, g] = canvas(48, 40);
  disc(g, 24, 24, 16, "#b7aa9c");
  disc(g, 24, 23, 12, "#d9d0c4");
  disc(g, 24, 22, 8, "#5eb0ea");
  disc(g, 24, 21, 4, "#d7f2ff");
  g.fillStyle = "#8d8276";
  g.fillRect(22, 10, 4, 10);
  return c;
}

const HERO_PAL: Record<string, string> = {
  h: "#6b3a22",
  s: "#f3c7a2",
  e: "#2a2118",
  v: "#e0a04a",
  c: "#f7f1e4",
  p: "#4d6d90",
  b: "#5c3b24",
  g: "#3f8d45",
  k: "#f4e7b0",
};

const DOWN = [
  "...hhhhhh...",
  "..hhhhhhhh..",
  "..hhsssshh..",
  "..hsseesshh.",
  "..hsssssssh.",
  "...ssssss...",
  "..gvvvvvvg..",
  ".ccvvvvvvcc.",
  ".ccvvvvvvcc.",
  "..ppvvvvpp..",
  "..pppppppp..",
  "..pp....pp..",
  "..bb....bb..",
  "..bb....bb..",
];
const DOWN2 = [
  "...hhhhhh...",
  "..hhhhhhhh..",
  "..hhsssshh..",
  "..hsseesshh.",
  "..hsssssssh.",
  "...ssssss...",
  "..gvvvvvvg..",
  ".ccvvvvvvcc.",
  ".ccvvvvvvcc.",
  "..ppvvvvpp..",
  "...pppppp...",
  "..pp....pp..",
  ".bb......bb.",
  ".bb......bb.",
];
const UP = [
  "...hhhhhh...",
  "..hhhhhhhh..",
  "..hhhhhhhh..",
  "..hhhhhhhh..",
  "...hhhhhh...",
  "..gvvvvvvg..",
  ".ccvvvvvvcc.",
  ".ccvvvvvvcc.",
  "..ppvvvvpp..",
  "..pppppppp..",
  "..pp....pp..",
  "..bb....bb..",
  "..bb....bb..",
];
const SIDE = [
  "...hhhhh....",
  "..hhhhhhh...",
  "..hhssshh...",
  "..hssessh...",
  "..hsssssh...",
  "...sssss....",
  "..gvvvvv....",
  ".ccvvvvvv...",
  ".ccvvvvvv...",
  "..pppppp....",
  "..pp..pp....",
  "..bb..bb....",
  "..bb..bb....",
];
const SIDE2 = [
  "...hhhhh....",
  "..hhhhhhh...",
  "..hhssshh...",
  "..hssessh...",
  "..hsssssh...",
  "...sssss....",
  "..gvvvvv....",
  ".ccvvvvvv...",
  ".ccvvvvvv...",
  "...pppp.....",
  "..pp...pp...",
  ".bb....bb...",
  ".bb....bb...",
];

function makePerson(rows: string[], pal: Record<string, string>, hat: NpcLook["hat"], beard = false): HTMLCanvasElement {
  const [c, g] = canvas(16, 24);
  blit(g, rows, 1, 6, pal);
  if (beard) {
    g.fillStyle = pal.h ?? "#5a3a28";
    g.fillRect(5, 14, 6, 2);
  }
  if (hat === "flower") {
    dot(g, 4, 5, "#f2f6ea");
    dot(g, 9, 4, "#f7e27a");
    dot(g, 7, 5, "#e07070");
  } else if (hat === "cap") {
    g.fillStyle = "#5c3b24";
    g.fillRect(3, 5, 9, 2);
    g.fillRect(3, 6, 3, 2);
  } else if (hat === "straw") {
    g.fillStyle = "#e6c56a";
    g.fillRect(2, 5, 12, 2);
    g.fillRect(5, 3, 6, 2);
  } else if (hat === "hood") {
    g.fillStyle = pal.v ?? "#3c4d86";
    g.fillRect(3, 4, 10, 4);
  } else if (hat === "bun") {
    disc(g, 8, 5, 2, pal.h ?? "#3a2418");
  }
  return c;
}

function makeHero(dir: Dir, step: boolean): HTMLCanvasElement {
  const rows = dir === "up" ? UP : dir === "down" ? (step ? DOWN2 : DOWN) : step ? SIDE2 : SIDE;
  const c = makePerson(rows, HERO_PAL, "none");
  if (dir === "left") {
    const [f, g] = canvas(16, 24);
    g.save();
    g.translate(16, 0);
    g.scale(-1, 1);
    g.drawImage(c, 0, 0);
    g.restore();
    return f;
  }
  return c;
}

function makeNpc(look: NpcLook, step: boolean): [HTMLCanvasElement, HTMLCanvasElement] {
  const pal: Record<string, string> = {
    h: look.hair,
    s: look.skin,
    e: "#2a2118",
    v: look.outfit,
    c: "#f7f1e4",
    p: look.pants,
    b: "#4a3424",
    g: look.outfit,
  };
  const stand = makePerson(DOWN, pal, look.hat, look.beard);
  const walk = makePerson(step ? DOWN2 : DOWN, pal, look.hat, look.beard);
  return [stand, walk];
}

function makeCrop(stage: number, color: string): HTMLCanvasElement {
  const [c, g] = canvas(16, 16);
  g.fillStyle = "#6b4a2a";
  g.fillRect(2, 10, 12, 4);
  if (stage >= 1) {
    g.fillStyle = "#3f8d45";
    g.fillRect(7, 8, 2, 4);
    g.fillRect(5, 7, 3, 2);
  }
  if (stage >= 2) {
    g.fillStyle = "#67b85a";
    g.fillRect(4, 5, 8, 4);
  }
  if (stage >= 3) {
    disc(g, 8, 5, 3, color);
  }
  return c;
}

function makeIcon(draw: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const [c, g] = canvas(16, 16);
  draw(g);
  return c;
}

export function makeArt(world: World): Art {
  const [terrain, tg] = canvas(MAP_W * TILE, MAP_H * TILE);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = world.tiles[y * MAP_W + x] ?? GRASS;
      const px = x * TILE;
      const py = y * TILE;
      if (t === GRASS || t === FOREST) {
        tg.fillStyle = t === FOREST ? (hashish(x, y) > 0.5 ? "#4e8c3c" : "#3f7a32") : hashish(x, y) > 0.5 ? "#78c255" : "#69b348";
        tg.fillRect(px, py, 16, 16);
        if (hashish(x, y, 2) > 0.62) {
          tg.fillStyle = t === FOREST ? "#6aaa50" : "#9adf72";
          tg.fillRect(px + 3, py + 10, 2, 3);
          tg.fillRect(px + 5, py + 9, 1, 2);
        }
        if (t === GRASS && hashish(x, y, 3) > 0.9) {
          tg.fillStyle = "#f4f6ea";
          tg.fillRect(px + 10, py + 5, 2, 2);
          tg.fillStyle = "#f7e27a";
          tg.fillRect(px + 12, py + 6, 2, 2);
        }
        if (t === FOREST && hashish(x, y, 4) > 0.8) {
          tg.fillStyle = "#2f5a28";
          tg.fillRect(px + 8, py + 12, 4, 1);
        }
      } else if (t === PATH) {
        tg.fillStyle = "#c4a15a";
        tg.fillRect(px, py, 16, 16);
        tg.fillStyle = "#ddc48a";
        tg.fillRect(px + (x % 3), py + 3, 3, 2);
        tg.fillStyle = "#a8843e";
        tg.fillRect(px + 8, py + 10, 4, 2);
      } else if (t === COBBLE) {
        tg.fillStyle = "#cbbfa8";
        tg.fillRect(px, py, 16, 16);
        tg.fillStyle = "#b3a58c";
        tg.fillRect(px + 1, py + 1, 6, 5);
        tg.fillRect(px + 8, py + 3, 6, 5);
        tg.fillRect(px + 3, py + 9, 6, 5);
      } else if (t === WATER) {
        tg.fillStyle = hashish(x, y, 5) > 0.5 ? "#2f7ec8" : "#3c92d8";
        tg.fillRect(px, py, 16, 16);
        tg.fillStyle = "rgba(210,236,255,0.45)";
        tg.fillRect(px + 2, py + 4, 8, 1);
        tg.fillRect(px + 6, py + 11, 7, 1);
      } else if (t === SAND) {
        tg.fillStyle = "#e6d3a0";
        tg.fillRect(px, py, 16, 16);
        tg.fillStyle = "#f3e6c2";
        tg.fillRect(px + 4, py + 6, 2, 1);
        tg.fillRect(px + 10, py + 11, 3, 1);
      } else if (t === SOIL) {
        tg.fillStyle = "#8d5a32";
        tg.fillRect(px, py, 16, 16);
        tg.fillStyle = "#6b4224";
        tg.fillRect(px + 2, py + 3, 4, 2);
        tg.fillRect(px + 8, py + 9, 5, 2);
      } else if (t === DOCK) {
        tg.fillStyle = "#c4894a";
        tg.fillRect(px, py, 16, 16);
        tg.fillStyle = "#8a5a30";
        tg.fillRect(px, py, 16, 1);
        tg.fillRect(px + 4, py, 1, 16);
        tg.fillRect(px + 11, py, 1, 16);
      }
    }
  }

  const [interior, ig] = canvas(IW * TILE, IH * TILE);
  ig.fillStyle = "#6b4226";
  ig.fillRect(0, 0, IW * TILE, IH * TILE);
  for (let y = 1; y < IH - 1; y++) {
    for (let x = 1; x < IW - 1; x++) {
      ig.fillStyle = (x + y) % 2 ? "#c4965c" : "#d2a86a";
      ig.fillRect(x * TILE, y * TILE, 16, 16);
      ig.fillStyle = "rgba(90,50,20,0.15)";
      ig.fillRect(x * TILE, y * TILE, 16, 1);
    }
  }
  ig.fillStyle = "#5c3a28";
  ig.fillRect(2 * TILE, 0, 6 * TILE, 10);
  ig.fillStyle = "#9fd7f2";
  ig.fillRect(3 * TILE, 2, 16, 8);
  ig.fillRect(5 * TILE, 2, 16, 8);
  ig.fillStyle = "#efe6d2";
  ig.fillRect(8 * TILE, 2, 20, 14);

  const trees = [0, 1, 2, 3].map((s) => makeTree(false, s));
  const pines = [0, 1, 2, 3].map((s) => makeTree(true, s));
  const rocks = [0, 1, 2, 3].map((s) => makeRock(s));
  const hero = {
    down: [makeHero("down", false), makeHero("down", true)] as [HTMLCanvasElement, HTMLCanvasElement],
    up: [makeHero("up", false), makeHero("up", true)] as [HTMLCanvasElement, HTMLCanvasElement],
    left: [makeHero("left", false), makeHero("left", true)] as [HTMLCanvasElement, HTMLCanvasElement],
    right: [makeHero("right", false), makeHero("right", true)] as [HTMLCanvasElement, HTMLCanvasElement],
  };
  const npcs: Art["npcs"] = {};
  for (const n of world.npcs) npcs[n.id] = makeNpc(n.look, true);

  const [sheep] = canvas(20, 16);
  {
    const g = sheep.getContext("2d")!;
    disc(g, 10, 9, 7, "#f7f4ee");
    disc(g, 10, 8, 5, "#ffffff");
    g.fillStyle = "#2a2118";
    g.fillRect(4, 12, 2, 3);
    g.fillRect(14, 12, 2, 3);
    g.fillStyle = "#e7c2a4";
    g.fillRect(15, 7, 4, 3);
    dot(g, 17, 8, "#2a2118");
  }
  const [duck] = canvas(16, 12);
  {
    const g = duck.getContext("2d")!;
    disc(g, 7, 6, 4, "#f4e27a");
    g.fillStyle = "#e6a020";
    g.fillRect(11, 5, 4, 2);
    dot(g, 6, 5, "#2a2118");
  }
  const [cat] = canvas(16, 12);
  {
    const g = cat.getContext("2d")!;
    disc(g, 8, 7, 5, "#c47a3a");
    dot(g, 4, 3, "#c47a3a");
    dot(g, 11, 3, "#c47a3a");
    dot(g, 6, 6, "#2a2118");
    dot(g, 10, 6, "#2a2118");
  }
  const [plot] = canvas(16, 16);
  {
    const g = plot.getContext("2d")!;
    g.fillStyle = "#6b3e22";
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = "#8d5a32";
    g.fillRect(1, 1, 14, 14);
    g.fillStyle = "#c9a06a";
    g.fillRect(0, 0, 16, 2);
    g.fillRect(0, 14, 16, 2);
    g.fillRect(0, 0, 2, 16);
    g.fillRect(14, 0, 2, 16);
  }
  const crops: Art["crops"] = {
    daisy: [0, 1, 2, 3].map((s) => makeCrop(s, "#f7f6ea")),
    turnip: [0, 1, 2, 3].map((s) => makeCrop(s, "#efe6d2")),
    tomato: [0, 1, 2, 3].map((s) => makeCrop(s, "#d6453d")),
    bloom: [0, 1, 2, 3].map((s) => makeCrop(s, "#f0c14a")),
  };
  const nodes: Art["nodes"] = {};
  const iconDraw: Record<string, (g: CanvasRenderingContext2D) => void> = {
    daisy: (g) => {
      disc(g, 8, 8, 4, "#f7f6ea");
      disc(g, 8, 8, 2, "#f0c14a");
    },
    tulip: (g) => {
      g.fillStyle = "#e07090";
      g.fillRect(6, 4, 4, 6);
      g.fillStyle = "#3f8d45";
      g.fillRect(7, 10, 2, 4);
    },
    poppy: (g) => disc(g, 8, 8, 4, "#d6453d"),
    mushroom: (g) => {
      disc(g, 8, 7, 5, "#c96b4a");
      g.fillStyle = "#efe6d2";
      g.fillRect(6, 8, 4, 6);
    },
    berry: (g) => disc(g, 8, 8, 4, "#7a3e86"),
    herb: (g) => {
      g.fillStyle = "#3f8d45";
      g.fillRect(7, 3, 2, 10);
      g.fillRect(4, 5, 4, 2);
      g.fillRect(8, 8, 4, 2);
    },
    feather: (g) => {
      g.fillStyle = "#f7f4ee";
      g.fillRect(8, 2, 2, 12);
      g.fillRect(6, 4, 2, 6);
    },
    shell: (g) => disc(g, 8, 8, 5, "#f3d7b0"),
    sketch: (g) => {
      g.fillStyle = "#efe6d2";
      g.fillRect(3, 2, 10, 12);
      g.fillStyle = "#5c3b24";
      g.fillRect(5, 5, 6, 1);
      g.fillRect(5, 8, 5, 1);
    },
    wood: (g) => {
      g.fillStyle = "#8a5a30";
      g.fillRect(3, 6, 10, 4);
      g.fillStyle = "#c4a15a";
      g.fillRect(3, 6, 10, 1);
    },
    stone: (g) => disc(g, 8, 9, 5, "#b7aa9c"),
    turnip: (g) => {
      disc(g, 8, 10, 4, "#efe6d2");
      g.fillStyle = "#3f8d45";
      g.fillRect(7, 3, 2, 4);
    },
    tomato: (g) => disc(g, 8, 9, 5, "#d6453d"),
    bloom: (g) => {
      disc(g, 8, 8, 5, "#f0c14a");
      disc(g, 8, 8, 2, "#fff4c8");
    },
    fish_minnow: (g) => {
      g.fillStyle = "#d7e6f2";
      g.fillRect(3, 7, 9, 3);
      g.fillRect(11, 6, 2, 5);
    },
    fish_perch: (g) => {
      g.fillStyle = "#6ea84a";
      g.fillRect(3, 6, 9, 4);
      g.fillStyle = "#2a2118";
      g.fillRect(5, 7, 1, 1);
    },
    fish_koi: (g) => {
      g.fillStyle = "#f0a04a";
      g.fillRect(2, 6, 10, 4);
      g.fillStyle = "#f7f4ee";
      g.fillRect(5, 7, 2, 2);
    },
    fish_eel: (g) => {
      g.fillStyle = "#3c4d6e";
      g.fillRect(2, 8, 12, 2);
      g.fillRect(4, 6, 8, 2);
    },
    fish_carp: (g) => {
      disc(g, 8, 8, 5, "#d7d2ea");
      dot(g, 6, 7, "#2a2118");
    },
    seed_daisy: (g) => {
      g.fillStyle = "#c4a15a";
      g.fillRect(4, 8, 8, 4);
      dot(g, 6, 9, "#f7f6ea");
    },
    seed_turnip: (g) => {
      g.fillStyle = "#6b4226";
      g.fillRect(4, 8, 8, 4);
    },
    seed_tomato: (g) => {
      g.fillStyle = "#a33b3c";
      g.fillRect(4, 8, 8, 4);
    },
    seed_bloom: (g) => {
      g.fillStyle = "#e0a04a";
      g.fillRect(4, 7, 8, 5);
    },
    furn_chair: (g) => {
      g.fillStyle = "#8a5a30";
      g.fillRect(4, 3, 8, 6);
      g.fillRect(4, 9, 2, 4);
      g.fillRect(10, 9, 2, 4);
    },
    furn_table: (g) => {
      g.fillStyle = "#a56b3d";
      g.fillRect(2, 6, 12, 3);
      g.fillRect(3, 9, 2, 4);
      g.fillRect(11, 9, 2, 4);
    },
    furn_lamp: (g) => {
      g.fillStyle = "#e0a04a";
      g.fillRect(6, 3, 4, 6);
      g.fillStyle = "#5c3b24";
      g.fillRect(7, 9, 2, 4);
    },
    furn_shelf: (g) => {
      g.fillStyle = "#6b4226";
      g.fillRect(3, 3, 10, 10);
      g.fillStyle = "#d6453d";
      g.fillRect(5, 5, 2, 3);
      g.fillStyle = "#3c6ea5";
      g.fillRect(8, 5, 2, 3);
    },
    furn_plant: (g) => {
      g.fillStyle = "#c47a3a";
      g.fillRect(5, 9, 6, 4);
      g.fillStyle = "#3f8d45";
      g.fillRect(4, 4, 8, 5);
    },
    furn_cushion: (g) => {
      g.fillStyle = "#a33b3c";
      g.fillRect(3, 6, 10, 6);
    },
    furn_bed: (g) => {
      g.fillStyle = "#8a5a30";
      g.fillRect(2, 4, 12, 9);
      g.fillStyle = "#f7f4ee";
      g.fillRect(3, 6, 10, 4);
      g.fillStyle = "#d6453d";
      g.fillRect(3, 8, 10, 3);
    },
    furn_stove: (g) => {
      g.fillStyle = "#5c5148";
      g.fillRect(3, 4, 10, 9);
      g.fillStyle = "#2a2118";
      g.fillRect(5, 6, 6, 3);
    },
    furn_chest: (g) => {
      g.fillStyle = "#8a5a30";
      g.fillRect(3, 5, 10, 7);
      g.fillStyle = "#e0a04a";
      g.fillRect(7, 7, 2, 2);
    },
    furn_rug: (g) => {
      g.fillStyle = "#a33b3c";
      g.fillRect(2, 4, 12, 8);
      g.fillStyle = "#e7c2a4";
      g.fillRect(4, 6, 8, 4);
    },
    relic_lantern: (g) => {
      g.fillStyle = "#e0a04a";
      g.fillRect(5, 4, 6, 8);
      g.fillStyle = "#fff4c8";
      g.fillRect(7, 6, 2, 3);
    },
  };
  const icons: Record<string, HTMLCanvasElement> = {};
  for (const [id, fn] of Object.entries(iconDraw)) {
    icons[id] = makeIcon(fn);
    nodes[id] = icons[id]!;
  }

  const [lamp] = canvas(10, 18);
  {
    const g = lamp.getContext("2d")!;
    g.fillStyle = "#5c3b24";
    g.fillRect(4, 6, 2, 12);
    g.fillStyle = "#e0a04a";
    g.fillRect(2, 2, 6, 6);
    g.fillStyle = "#fff4c8";
    g.fillRect(4, 4, 2, 2);
  }
  const [fence] = canvas(16, 14);
  {
    const g = fence.getContext("2d")!;
    g.fillStyle = "#a56b3d";
    g.fillRect(1, 2, 3, 12);
    g.fillRect(12, 2, 3, 12);
    g.fillRect(0, 4, 16, 3);
    g.fillRect(0, 9, 16, 2);
  }
  const [fenceBroken] = canvas(16, 14);
  {
    const g = fenceBroken.getContext("2d")!;
    g.fillStyle = "#8a5a30";
    g.fillRect(1, 6, 3, 8);
    g.fillRect(0, 8, 8, 2);
    g.fillRect(11, 10, 4, 2);
  }

  return {
    terrain,
    interior,
    trees,
    pines,
    rocks,
    cottage: makeHouse("cottage"),
    cafe: makeHouse("cafe"),
    workshop: makeHouse("workshop"),
    house: makeHouse("house"),
    fountain: makeFountain(),
    hero,
    npcs,
    sheep,
    duck,
    cat,
    plot,
    crops,
    nodes,
    icons,
    lamp,
    fence,
    fenceBroken,
  };
}

function hashish(x: number, y: number, salt = 1): number {
  let n = Math.imul(x + salt * 13, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function iconUrl(art: Art, id: string): string {
  const c = art.icons[id];
  return c ? c.toDataURL() : "";
}
