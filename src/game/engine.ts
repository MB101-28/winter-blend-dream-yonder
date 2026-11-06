import { AudioBus } from "./audio";
import {
  CROP_DAYS,
  FISH,
  ITEM,
  ITEMS,
  LORE,
  REGIONS,
  SEED_TO_CROP,
  FURN_SIZE,
  notices,
  pickFish,
  questsOf,
  takeFish,
  talkTo,
} from "./content";
import { defaultSave, hasSave, hydrateSave, readSave, writeSave } from "./save";
import { iconUrl, makeArt, type Art } from "./sprites";
import {
  DAY_LEN,
  MAP_H,
  MAP_W,
  TILE,
  type Dir,
  type Effect,
  type SaveData,
  type ViewState,
  type World,
} from "./types";
import { buildWorld, DOCK, IH, IW, regionName, tileAt, WATER } from "./world";

type Cmd = { y: number; draw: () => void };
type Critter = { x: number; y: number; a: number; v: number; kind: "sheep" | "duck" | "bird" | "butter" | "cat"; c?: string };
type NpcRt = { id: string; name: string; x: number; y: number; dir: Dir; pi: number; pause: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const HOLD = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export function dayOf(time: number): number {
  return Math.floor(time / DAY_LEN) + 1;
}
export function phaseOf(time: number): number {
  return (time % DAY_LEN) / DAY_LEN;
}
export function clockOf(time: number): string {
  const mins = Math.floor(phaseOf(time) * 24 * 60) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
export function phaseName(time: number): string {
  const p = phaseOf(time);
  if (p < 0.22 || p >= 0.9) return "Night";
  if (p < 0.4) return "Morning";
  if (p < 0.62) return "Afternoon";
  if (p < 0.78) return "Evening";
  return "Dusk";
}

function lightFor(phase: number): { alpha: number; color: string } {
  const keys = [
    { p: 0, a: 0.48, c: "#17233f" },
    { p: 0.18, a: 0.22, c: "#c47858" },
    { p: 0.3, a: 0.02, c: "#fff4d8" },
    { p: 0.58, a: 0.03, c: "#fff6dc" },
    { p: 0.7, a: 0.22, c: "#e07a3a" },
    { p: 0.84, a: 0.42, c: "#2a2048" },
    { p: 1, a: 0.48, c: "#17233f" },
  ];
  let i = 0;
  while (i < keys.length - 1 && phase > keys[i + 1]!.p) i++;
  const a = keys[i]!;
  const b = keys[Math.min(keys.length - 1, i + 1)]!;
  const t = b.p === a.p ? 0 : (phase - a.p) / (b.p - a.p);
  return { alpha: a.a + (b.a - a.a) * t, color: t < 0.5 ? a.c : b.c };
}

export class Game {
  readonly world: World;
  readonly art: Art;
  save: SaveData;
  screen: "title" | "play" = "title";
  panel: ViewState["panel"] = "none";
  audio = new AudioBus();
  keys = new Set<string>();
  fishing = false;
  bob = 0.2;
  private bobDir = 1;
  private zone = 0.35;
  private zoneW = 0.26;
  decorate = false;
  furnPick: string | null = null;
  private selected: string | null = null;
  private bookTab: ViewState["bookTab"] = "forage";
  private dialogue: ViewState["dialogue"] = null;
  private seedPlot: string | null = null;
  private toastMsg: string | null = null;
  private toastT = 0;
  private savedFlash = 0;
  private dirty = false;
  private saveAcc = 0;
  private hudAcc = 0;
  private anim = 0;
  private stepDist = 0;
  private walkT = 0;
  private speed = 0;
  private heading = 0;
  private camX = 30 * TILE;
  private camY = 28 * TILE;
  private cssW = 800;
  private cssH = 600;
  private dpr = 1;
  private scale = 3;
  private raf = 0;
  private alive = true;
  private last = 0;
  private readonly onChange: (v: ViewState) => void;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private npcs: NpcRt[];
  private critters: Critter[];
  private sparks: Spark[] = [];
  private urls = new Map<string, string>();
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onBlur: () => void;
  private onHide: () => void;
  private onPointer: (e: PointerEvent) => void;
  private onResize: () => void;

  constructor(canvas: HTMLCanvasElement, onChange: (v: ViewState) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    this.ctx = ctx;
    this.onChange = onChange;
    this.world = buildWorld();
    this.art = makeArt(this.world);
    this.save = defaultSave(this.world.plots);
    const stored = readSave();
    if (stored?.settings) {
      this.save.settings = stored.settings;
      this.audio.setVolumes(stored.settings.music, stored.settings.sfx);
    }
    this.npcs = this.world.npcs.map((n) => ({
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
      dir: "down" as Dir,
      pi: 0,
      pause: Math.random() * 2,
    }));
    this.critters = [
      { x: 12 * TILE, y: 44 * TILE, a: 0.4, v: 12, kind: "sheep" },
      { x: 20 * TILE, y: 46 * TILE, a: 1.2, v: 10, kind: "sheep" },
      { x: 28 * TILE, y: 43 * TILE, a: 2, v: 11, kind: "sheep" },
      { x: 62 * TILE, y: 36 * TILE, a: 0, v: 16, kind: "duck" },
      { x: 58 * TILE, y: 40 * TILE, a: 1, v: 14, kind: "duck" },
      { x: 36 * TILE, y: 27 * TILE, a: 0, v: 0, kind: "cat" },
      { x: 80, y: 80, a: 0, v: 28, kind: "bird" },
      { x: 400, y: 120, a: 0, v: 36, kind: "bird" },
      { x: 700, y: 200, a: 0, v: 22, kind: "bird" },
    ];
    const colors = ["#f7e27a", "#f2f6ea", "#e07090", "#9fd7f2"];
    for (let i = 0; i < 14; i++) {
      this.critters.push({
        x: 80 + Math.random() * 900,
        y: 200 + Math.random() * 500,
        a: Math.random() * 6,
        v: 18,
        kind: "butter",
        c: colors[i % colors.length],
      });
    }
    this.onKeyDown = (e) => this.keyDown(e);
    this.onKeyUp = (e) => this.keys.delete(e.code);
    this.onBlur = () => this.keys.clear();
    this.onHide = () => {
      if (document.hidden && this.screen === "play") this.persist();
    };
    this.onPointer = (e) => this.pointer(e);
    this.onResize = () => this.resize();
  }

  start(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onHide);
    window.addEventListener("pagehide", this.onHide);
    this.canvas.addEventListener("pointerdown", this.onPointer);
    window.addEventListener("resize", this.onResize);
    this.resize();
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.alive) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.expose();
    this.emit();
  }

  destroy(): void {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onHide);
    window.removeEventListener("pagehide", this.onHide);
    this.canvas.removeEventListener("pointerdown", this.onPointer);
    window.removeEventListener("resize", this.onResize);
    this.audio.destroy();
    if (window.__controlsTest) delete window.__controlsTest;
  }

  unlock(): void {
    try {
      this.audio.unlock();
    } catch {
      /* audio is optional */
    }
  }

  newGame(): void {
    this.unlock();
    const settings = this.save.settings;
    this.save = defaultSave(this.world.plots);
    this.save.settings = settings;
    this.audio.setVolumes(settings.music, settings.sfx);
    this.enterPlay();
    this.toast("Grandma Rowan's letter is in your journal.");
    this.persist();
  }

  continue(): void {
    this.unlock();
    const raw = readSave();
    if (!raw) {
      this.toast("No saved lantern to carry.");
      this.emit();
      return;
    }
    this.save = hydrateSave(raw, this.world.plots);
    this.audio.setVolumes(this.save.settings.music, this.save.settings.sfx);
    this.enterPlay();
    this.toast("Welcome back.");
  }

  private enterPlay(): void {
    this.screen = "play";
    this.panel = "none";
    this.dialogue = null;
    this.fishing = false;
    this.decorate = false;
    this.camX = this.save.x;
    this.camY = this.save.y;
    this.dirty = true;
    this.emit();
  }

  pressE(): void {
    if (this.fishing) this.reel();
    else if (this.screen === "play" && this.panel === "none") this.interact();
  }

  setHold(code: string, down: boolean): void {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
  }

  setPanel(panel: ViewState["panel"]): void {
    if (this.screen !== "play" && panel !== "settings" && panel !== "none") return;
    this.panel = this.panel === panel ? "none" : panel;
    if (this.panel !== "dialogue") this.dialogue = null;
    if (this.panel !== "seeds") this.seedPlot = null;
    this.fishing = false;
    this.emit();
  }

  closePanel(): void {
    this.panel = "none";
    this.dialogue = null;
    this.seedPlot = null;
    this.emit();
  }

  setBook(tab: ViewState["bookTab"]): void {
    this.bookTab = tab;
    this.emit();
  }

  select(id: string): void {
    this.selected = id;
    if (this.decorate && FURN_SIZE[id] && (this.save.items[id] ?? 0) > 0) this.furnPick = id;
    this.emit();
  }

  toggleDecorate(): void {
    if (this.save.map !== "in") {
      this.toast("Furniture belongs inside the cottage.");
      this.emit();
      return;
    }
    this.decorate = !this.decorate;
    this.furnPick = null;
    this.toast(this.decorate ? "Tap a piece, then the floor. Tap a placed piece to pack it." : "The room settles.");
    this.emit();
  }

  choose(id: string): void {
    if (!this.dialogue) return;
    const choice = this.dialogue.choices.find((c) => c.id === id);
    if (!choice) return;
    if (id === "close" && choice.effects.length === 0 && !choice.shop && !choice.say) {
      this.closePanel();
      return;
    }
    if (!this.apply(choice.effects)) {
      this.emit();
      return;
    }
    this.audio.talk();
    if (choice.shop) {
      this.dialogue = null;
      this.panel = choice.shop === "cafe" ? "shop" : "workshop";
      this.emit();
      return;
    }
    if (choice.say) {
      this.dialogue = {
        name: this.dialogue.name,
        text: choice.say,
        choices: [{ id: "close", label: "Close", effects: [] }],
      };
      this.panel = "dialogue";
    } else {
      this.dialogue = null;
      this.panel = "none";
    }
    this.markHearth();
    this.dirty = true;
    this.emit();
  }

  buy(id: string): void {
    const def = ITEM[id];
    if (!def?.buy) return;
    if (this.save.coins < def.buy) {
      this.toast("A few more coins, whenever the meadow is kind.");
      this.emit();
      return;
    }
    this.save.coins -= def.buy;
    this.addItem(id, 1);
    this.audio.collect();
    this.toast(`You tuck away ${def.name}.`);
    this.dirty = true;
    this.emit();
  }

  sell(id: string): void {
    const def = ITEM[id];
    if (!def || def.sell <= 0) return;
    if (!this.take(id, 1)) return;
    this.save.coins += def.sell;
    this.audio.collect();
    this.toast(`Sold for ${def.sell} coins.`);
    this.dirty = true;
    this.emit();
  }

  plant(seedId: string): void {
    const plotId = this.seedPlot;
    const crop = SEED_TO_CROP[seedId];
    const plot = plotId ? this.save.plots[plotId] : undefined;
    if (!plot || !crop) return;
    if (!this.take(seedId, 1)) {
      this.toast("Those seeds are already in the ground, or the pack.");
      this.emit();
      return;
    }
    plot.crop = crop;
    plot.stage = 0;
    plot.wateredOnDay = 0;
    this.audio.plant();
    this.toast("Tucked into the soil. A drink of water will help.");
    this.seedPlot = null;
    this.panel = "none";
    this.dirty = true;
    this.emit();
  }

  reel(): void {
    if (!this.fishing) return;
    const hit = this.bob >= this.zone && this.bob <= this.zone + this.zoneW;
    if (!hit) {
      this.zone = 0.08 + Math.random() * (0.84 - this.zoneW);
      this.toast("The ripple drifts off. The water doesn't mind.");
      this.audio.splash();
      this.emit();
      return;
    }
    const id = pickFish(!!this.save.flags.betterRod);
    this.addItem(id, 1);
    this.save.fish[id] = (this.save.fish[id] ?? 0) + 1;
    this.fishing = false;
    this.audio.collect();
    this.burst(this.save.x, this.save.y - 10, "#d7f2ff");
    this.toast(`A ${ITEM[id]?.name ?? "fish"} comes along, curious.`);
    this.dirty = true;
    this.emit();
  }

  setVolumes(music: number, sfx: number): void {
    this.save.settings = { music, sfx };
    this.audio.setVolumes(music, sfx);
    this.dirty = true;
    this.emit();
  }

  private keyDown(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (HOLD.has(e.code)) this.keys.add(e.code);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === "Escape") {
      if (this.fishing) {
        this.fishing = false;
        this.toast("You wind the line in.");
        this.emit();
        return;
      }
      if (this.panel !== "none") this.closePanel();
      else if (this.screen === "play") this.setPanel("pause");
      return;
    }
    if (this.screen !== "play") return;
    if (this.fishing && (e.code === "KeyE" || e.code === "Space")) {
      this.reel();
      return;
    }
    if (this.panel !== "none") return;
    if (e.code === "KeyE" || e.code === "Space") this.interact();
    else if (e.code === "KeyI") this.setPanel("inventory");
    else if (e.code === "KeyJ") this.setPanel("journal");
    else if (e.code === "KeyM") this.setPanel("map");
    else if (e.code === "KeyC") this.setPanel("book");
    else if (e.code === "KeyR") this.toggleDecorate();
  }

  private pointer(e: PointerEvent): void {
    if (this.screen !== "play") return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wx = (sx - this.cssW / 2) / this.scale + this.camX;
    const wy = (sy - this.cssH / 2) / this.scale + this.camY;
    if (this.fishing) {
      this.reel();
      return;
    }
    if (this.decorate && this.save.map === "in") {
      this.decorateAt(wx, wy);
      return;
    }
    if (this.panel !== "none") return;
    const hit = this.nearest(wx, wy, 28);
    if (hit && Math.hypot(wx - this.save.x, wy - this.save.y) < 90) hit.run();
  }

  private decorateAt(wx: number, wy: number): void {
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    const hit = this.save.furniture.find((f) => {
      const size = FURN_SIZE[f.item] ?? { w: 1, h: 1 };
      return tx >= f.tx && ty >= f.ty && tx < f.tx + size.w && ty < f.ty + size.h;
    });
    if (hit) {
      this.addItem(hit.item, 1);
      this.save.furniture = this.save.furniture.filter((f) => f.uid !== hit.uid);
      this.toast("Back in the pack.");
      this.dirty = true;
      this.emit();
      return;
    }
    if (!this.furnPick) {
      this.toast("Choose a piece from your pack first.");
      this.emit();
      return;
    }
    if (!this.canPlace(this.furnPick, tx, ty)) {
      this.toast("That spot is a little crowded.");
      this.emit();
      return;
    }
    if (!this.take(this.furnPick, 1)) return;
    const counts = ["furn_chair", "furn_table", "furn_lamp", "furn_shelf", "furn_plant", "furn_cushion"];
    this.save.furniture.push({
      uid: `p${Math.random().toString(36).slice(2, 8)}`,
      item: this.furnPick,
      tx,
      ty,
      bought: counts.includes(this.furnPick),
    });
    this.markHearth();
    this.audio.plant();
    this.toast("Placed.");
    if ((this.save.items[this.furnPick] ?? 0) <= 0) this.furnPick = null;
    this.dirty = true;
    this.emit();
  }

  private canPlace(item: string, tx: number, ty: number): boolean {
    const size = FURN_SIZE[item];
    if (!size) return false;
    for (let y = 0; y < size.h; y++) {
      for (let x = 0; x < size.w; x++) {
        const gx = tx + x;
        const gy = ty + y;
        if (gx < 1 || gy < 1 || gx >= IW - 1 || gy >= IH - 1 || gy >= 10) return false;
        if (this.world.interiorSolid[gy * IW + gx]) return false;
      }
    }
    for (const f of this.save.furniture) {
      const o = FURN_SIZE[f.item] ?? { w: 1, h: 1 };
      const overlap = tx < f.tx + o.w && tx + size.w > f.tx && ty < f.ty + o.h && ty + size.h > f.ty;
      if (overlap) return false;
    }
    return true;
  }

  private markHearth(): void {
    const n = this.save.furniture.filter((f) => f.bought).length;
    if (n >= 3) this.save.flags.hearth = 1;
  }

  private update(dt: number): void {
    this.anim += dt;
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toastMsg = null;
    }
    if (this.savedFlash > 0) this.savedFlash -= dt;
    this.updateCritters(dt);
    const frozen = this.screen !== "play" || this.panel !== "none" || this.fishing;
    if (!frozen) {
      this.save.time += dt;
      this.rollDay();
      this.move(dt);
      this.wanderNpcs(dt);
      const region = regionName(this.save.x, this.save.y, this.save.map);
      if (!this.save.regions.includes(region)) {
        this.save.regions.push(region);
        this.toast(`You find ${region}.`);
        this.dirty = true;
      }
    } else if (this.screen === "title") {
      const tx = 30 * TILE + Math.sin(this.anim * 0.18) * 50;
      const ty = 28 * TILE + Math.cos(this.anim * 0.13) * 24;
      this.camX += (tx - this.camX) * Math.min(1, dt);
      this.camY += (ty - this.camY) * Math.min(1, dt);
    }
    if (this.fishing) {
      this.bob += this.bobDir * dt * 0.42;
      if (this.bob > 1) {
        this.bob = 1;
        this.bobDir = -1;
      }
      if (this.bob < 0) {
        this.bob = 0;
        this.bobDir = 1;
      }
    }
    if (this.screen === "play" && this.panel === "none" && !this.fishing) {
      const goalX = this.save.x;
      const goalY = this.save.y - (this.save.map === "in" ? 0 : 6);
      if (this.save.map === "in") {
        this.camX = (IW * TILE) / 2;
        this.camY = (IH * TILE) / 2;
      } else {
        this.camX += (goalX - this.camX) * Math.min(1, dt * 5);
        this.camY += (goalY - this.camY) * Math.min(1, dt * 5);
      }
    }
    const phase = phaseOf(this.save.time);
    this.audio.setAmbience(phase, this.nearWater());
    if (this.audio.alive && phase > 0.28 && phase < 0.72 && Math.random() < dt * 0.35) this.audio.chirp();
    if (this.audio.alive && (phase < 0.2 || phase > 0.86) && Math.random() < dt * 0.7) this.audio.cricket();
    for (const s of this.sparks) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy -= 12 * dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    if (this.screen === "play") {
      this.saveAcc += dt;
      if (this.dirty && this.saveAcc > 8) this.persist();
    }
    this.hudAcc += dt;
    if (this.hudAcc > 0.5) {
      this.hudAcc = 0;
      this.emit();
    }
    this.expose();
  }

  private move(dt: number): void {
    let mx = 0;
    let my = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
    const len = Math.hypot(mx, my);
    if (len === 0) {
      this.speed = 0;
      return;
    }
    mx /= len;
    my /= len;
    if (Math.abs(mx) > Math.abs(my)) this.save.dir = mx < 0 ? "left" : "right";
    else this.save.dir = my < 0 ? "up" : "down";
    const spd = 86;
    const ox = this.save.x;
    const oy = this.save.y;
    const nx = this.save.x + mx * spd * dt;
    if (!this.blocked(nx, this.save.y)) this.save.x = nx;
    const ny = this.save.y + my * spd * dt;
    if (!this.blocked(this.save.x, ny)) this.save.y = ny;
    const moved = Math.hypot(this.save.x - ox, this.save.y - oy);
    this.speed = dt > 0 ? moved / dt : 0;
    this.heading = Math.atan2(this.save.y - oy, this.save.x - ox);
    if (moved > 0.2) {
      this.walkT += dt;
      this.stepDist += moved;
      if (this.stepDist > 18) {
        this.stepDist = 0;
        this.audio.step();
      }
      this.dirty = true;
    }
  }

  private blocked(px: number, py: number): boolean {
    const pts = [
      [px - 5, py - 4],
      [px + 5, py - 4],
      [px - 5, py + 2],
      [px + 5, py + 2],
    ];
    if (this.save.map === "in") {
      for (const [x, y] of pts) {
        const tx = Math.floor(x / TILE);
        const ty = Math.floor(y / TILE);
        if (tx < 0 || ty < 0 || tx >= IW || ty >= IH) return true;
        if (this.world.interiorSolid[ty * IW + tx]) return true;
      }
      for (const f of this.save.furniture) {
        const size = FURN_SIZE[f.item];
        if (!size?.block) continue;
        const x0 = f.tx * TILE + 2;
        const y0 = f.ty * TILE + 2;
        const x1 = (f.tx + size.w) * TILE - 2;
        const y1 = (f.ty + size.h) * TILE - 2;
        if (px > x0 && px < x1 && py > y0 && py < y1) return true;
      }
      return false;
    }
    for (const [x, y] of pts) {
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
      if (this.world.solid[ty * MAP_W + tx]) return true;
    }
    return false;
  }

  private wanderNpcs(dt: number): void {
    for (const npc of this.npcs) {
      const def = this.world.npcs.find((n) => n.id === npc.id);
      if (!def) continue;
      if (this.dialogue && this.panel === "dialogue") continue;
      if (npc.pause > 0) {
        npc.pause -= dt;
        continue;
      }
      const goal = def.path[npc.pi];
      if (!goal) continue;
      const dx = goal.x - npc.x;
      const dy = goal.y - npc.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) {
        npc.pi = (npc.pi + 1) % def.path.length;
        npc.pause = 0.8 + Math.random() * 1.6;
        continue;
      }
      npc.x += (dx / d) * 26 * dt;
      npc.y += (dy / d) * 26 * dt;
      npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
    }
    for (const c of this.critters) {
      if (c.kind === "sheep") {
        c.x += Math.cos(c.a) * c.v * dt;
        c.y += Math.sin(c.a) * c.v * 0.6 * dt;
        if (c.x < 6 * TILE || c.x > 32 * TILE) c.a = Math.PI - c.a;
        if (c.y < 41 * TILE || c.y > 49 * TILE) c.a = -c.a;
        if (Math.random() < dt * 0.3) c.a += 0.8;
      } else if (c.kind === "duck") {
        c.a += dt * 0.4;
        c.x = 60 * TILE + Math.cos(c.a) * 70;
        c.y = 36 * TILE + Math.sin(c.a * 1.3) * 40;
      } else if (c.kind === "bird") {
        c.x += c.v * dt;
        c.y += Math.sin(this.anim + c.x * 0.01) * 8 * dt;
        if (c.x > MAP_W * TILE + 20) c.x = -20;
      } else if (c.kind === "butter") {
        c.a += dt * 2;
        c.x += Math.cos(c.a) * c.v * dt;
        c.y += Math.sin(c.a * 1.7) * 12 * dt;
      }
    }
  }

  private updateCritters(dt: number): void {
    void dt;
  }

  private rollDay(): void {
    const day = dayOf(this.save.time);
    if (day === this.save.lastGrownDay) return;
    const prev = this.save.lastGrownDay;
    for (const plot of Object.values(this.save.plots)) {
      if (plot.crop && plot.wateredOnDay === prev) plot.stage += 1;
    }
    this.save.lastGrownDay = day;
    this.dirty = true;
  }

  private nearWater(): boolean {
    if (this.save.map === "in") return false;
    const tx = Math.floor(this.save.x / TILE);
    const ty = Math.floor(this.save.y / TILE);
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        if (tileAt(this.world, tx + x, ty + y) === WATER || tileAt(this.world, tx + x, ty + y) === DOCK) return true;
      }
    }
    return false;
  }

  private interact(): void {
    const hit = this.nearest(this.save.x, this.save.y, 46);
    if (!hit) {
      this.toast("Nothing here but good weather.");
      this.emit();
      return;
    }
    hit.run();
  }

  private nearest(x: number, y: number, reach: number): { d: number; run: () => void; label: string } | null {
    const opts: { d: number; run: () => void; label: string }[] = [];
    const add = (px: number, py: number, label: string, run: () => void, r = reach) => {
      const d = Math.hypot(px - x, py - y);
      if (d <= r) opts.push({ d, run, label });
    };
    if (this.save.map === "in") {
      for (const f of this.save.furniture) {
        const size = FURN_SIZE[f.item] ?? { w: 1, h: 1, block: false };
        const cx = (f.tx + size.w / 2) * TILE;
        const cy = (f.ty + size.h / 2) * TILE;
        if (f.item === "furn_bed") add(cx, cy, "Rest until morning", () => this.rest());
        if (f.item === "furn_chest") add(cx, cy, "Open the chest", () => this.setPanel("inventory"));
      }
      add(9 * TILE + 8, 11 * TILE, "Step outside", () => this.leaveCottage());
    } else {
      for (const n of this.npcs) add(n.x, n.y, `Talk to ${n.name}`, () => this.openNpc(n.id), 42);
      for (const node of this.world.nodes) {
        if (!this.nodeUp(node.id)) continue;
        const def = ITEM[node.item];
        add(node.x, node.y, `Gather ${def?.name ?? "something"}`, () => this.gather(node.id, node.item, node.x, node.y), 30);
      }
      for (const plot of this.world.plots) {
        const locked = plot.area === "extra" && this.save.harvests < 4;
        const state = this.save.plots[plot.id];
        if (!state) continue;
        let label = "Tend the bed";
        if (locked) label = "A bed for later";
        else if (state.crop && state.stage >= (CROP_DAYS[state.crop] ?? 9)) label = `Harvest ${ITEM[state.crop]?.name ?? "crop"}`;
        else if (state.crop && state.wateredOnDay !== dayOf(this.save.time)) label = "Water the bed";
        else if (!state.crop) label = "Plant something";
        else label = "This bed is content";
        add(plot.tx * TILE + 8, plot.ty * TILE + 8, label, () => this.tend(plot.id), 28);
      }
      for (const s of this.world.spots) {
        if (s.kind === "door") add(s.x, s.y, "Enter the cottage", () => this.enterCottage());
        if (s.kind === "fish") add(s.x, s.y, "Cast a line", () => this.cast());
        if (s.kind === "cafe") add(s.x, s.y, "Cafe counter", () => this.setPanel("shop"));
        if (s.kind === "workshop") add(s.x, s.y, "Workshop bench", () => this.setPanel("workshop"));
        if (s.kind === "notice") add(s.x, s.y, "Read the notices", () => this.say("Noticeboard", notices(dayOf(this.save.time))));
        if (s.kind === "fence")
          add(s.x, s.y, this.save.flags.fence ? "The mended fence" : "Mend the fence", () => this.mend());
        if (s.kind === "shrine") add(s.x, s.y, this.save.flags.lantern ? "The quiet clearing" : "Look in the roots", () => this.shrine());
        if (s.kind === "carving") add(s.x, s.y, "Read the stone", () => this.carving());
        if (s.kind === "nest") add(s.x, s.y, "A meadow nest", () => this.nest());
      }
    }
    opts.sort((a, b) => a.d - b.d);
    return opts[0] ?? null;
  }

  prompt(): string | null {
    if (this.screen !== "play" || this.panel !== "none" || this.fishing) return null;
    return this.nearest(this.save.x, this.save.y, 46)?.label ?? null;
  }

  private say(name: string, text: string): void {
    this.audio.talk();
    this.dialogue = { name, text, choices: [{ id: "close", label: "Close", effects: [] }] };
    this.panel = "dialogue";
    this.emit();
  }

  private openNpc(id: string): void {
    this.audio.talk();
    this.dialogue = talkTo(id, this.save);
    this.panel = "dialogue";
    this.emit();
  }

  private gather(id: string, item: string, x: number, y: number): void {
    this.addItem(item, 1);
    this.save.removed[id] = dayOf(this.save.time);
    this.audio.collect();
    this.burst(x, y, "#f6edd8");
    this.toast(`You gather ${ITEM[item]?.name ?? "a find"}.`);
    this.dirty = true;
    this.emit();
  }

  private nodeUp(id: string): boolean {
    const taken = this.save.removed[id];
    if (!taken) return true;
    return dayOf(this.save.time) - taken >= 2;
  }

  private tend(id: string): void {
    const def = this.world.plots.find((p) => p.id === id);
    const plot = this.save.plots[id];
    if (!def || !plot) return;
    if (def.area === "extra" && this.save.harvests < 4) {
      this.say("Garden bed", "These four beds are resting until the cottage has a few harvests behind it. Four is plenty. There is no rush.");
      return;
    }
    const day = dayOf(this.save.time);
    if (plot.crop && plot.stage >= (CROP_DAYS[plot.crop] ?? 9)) {
      const item = plot.crop;
      this.addItem(item, 1);
      plot.crop = null;
      plot.stage = 0;
      plot.wateredOnDay = 0;
      this.save.harvests += 1;
      this.audio.collect();
      this.burst(def.tx * TILE + 8, def.ty * TILE, "#9adf72");
      this.toast(`Harvested ${ITEM[item]?.name ?? "a crop"}.`);
      if (this.save.harvests === 4) this.toast("Four extra beds in the yard wake up.");
      this.dirty = true;
      this.emit();
      return;
    }
    if (plot.crop && plot.wateredOnDay !== day) {
      plot.wateredOnDay = day;
      this.audio.splash();
      this.toast("The soil drinks, and darkens.");
      this.dirty = true;
      this.emit();
      return;
    }
    if (plot.crop) {
      this.say("Garden bed", "This one has had its drink today. Sleep, or let the day turn. It will not mind if you wander off.");
      return;
    }
    const seeds = ITEMS.filter((i) => i.cat === "seed" && (this.save.items[i.id] ?? 0) > 0);
    if (seeds.length === 0) {
      this.say("Garden bed", "The bed is empty and willing. Hana sells seeds at the cafe, and a few may already be waiting in your pack later.");
      return;
    }
    this.seedPlot = id;
    this.panel = "seeds";
    this.emit();
  }

  private mend(): void {
    if (this.save.flags.fence) {
      this.say("Fence", "It stands. Tomas would pretend not to be pleased.");
      return;
    }
    if ((this.save.items.wood ?? 0) < 6) {
      this.say("Broken fence", "Six pieces of kindling would convince it to stand. The forest drops them when it feels generous.");
      return;
    }
    this.take("wood", 6);
    this.save.flags.fence = 1;
    this.save.coins += 50;
    if (!this.save.lore.includes("fence")) this.save.lore.push("fence");
    this.toast("The fence agrees to stand. Tomas would nod.");
    this.audio.plant();
    this.dirty = true;
    this.emit();
  }

  private shrine(): void {
    if (!this.save.flags.lantern) {
      this.addItem("relic_lantern", 1);
      this.save.flags.lantern = 1;
      this.toast("An old lantern, still faintly warm.");
      this.audio.collect();
      this.dirty = true;
      this.say("Lantern clearing", "The mushroom ring was keeping a lantern. It hums like a remembered song. Elder Lior might know the rest.");
      return;
    }
    this.say("Lantern clearing", "The ring of mushrooms is just a ring again. Light enough remains.");
  }

  private carving(): void {
    if (!this.save.lore.includes("initials")) this.save.lore.push("initials");
    this.discover("sketch");
    this.dirty = true;
    this.say("Worn stone", "Letters smoothed by weather: L + R, the summer the lanterns came home. The pond keeps the rest.");
  }

  private nest(): void {
    if (!this.save.flags.nest) {
      this.save.flags.nest = 1;
      this.addItem("sketch", 1);
      if (!this.save.lore.includes("nest")) this.save.lore.push("nest");
      this.toast("You sketch the nest and leave it be.");
      this.dirty = true;
    }
    this.say("Meadow nest", "Speckled and occupied by nobody at the moment. You don't take a thing. The sketch is enough.");
  }

  private cast(): void {
    this.fishing = true;
    this.bob = 0.15;
    this.bobDir = 1;
    this.zoneW = this.save.flags.betterRod ? 0.4 : 0.26;
    this.zone = 0.08 + Math.random() * (0.84 - this.zoneW);
    this.audio.splash();
    this.toast("The bobber settles.");
    this.emit();
  }

  private rest(): void {
    const day = dayOf(this.save.time);
    this.save.time = day * DAY_LEN + 0.3 * DAY_LEN;
    this.rollDay();
    this.audio.chirp();
    this.toast("You wake to birdsong. Nothing was in a hurry.");
    this.dirty = true;
    this.emit();
  }

  private enterCottage(): void {
    this.save.map = "in";
    this.save.x = 9 * TILE + 8;
    this.save.y = 10 * TILE;
    this.save.dir = "up";
    this.dirty = true;
    this.emit();
  }

  private leaveCottage(): void {
    this.save.map = "over";
    this.save.x = 10 * TILE + 8;
    this.save.y = 22 * TILE + 8;
    this.save.dir = "down";
    this.decorate = false;
    this.camX = this.save.x;
    this.camY = this.save.y;
    this.dirty = true;
    this.emit();
  }

  private apply(effects: Effect[]): boolean {
    for (const e of effects) {
      if (e.t === "item") this.addItem(e.id, e.n);
      else if (e.t === "take") {
        if (!this.take(e.id, e.n)) return false;
      } else if (e.t === "flag") {
        if (e.k === "q_hana" && !takeFish(this.save, 2)) {
          this.toast("The pot would like two fish still in your pack.");
          return false;
        }
        this.save.flags[e.k] = 1;
      } else if (e.t === "coin") this.save.coins += e.n;
      else if (e.t === "lore") {
        if (!this.save.lore.includes(e.id)) this.save.lore.push(e.id);
      } else if (e.t === "toast") this.toast(e.m);
      else if (e.t === "rod") this.save.flags.betterRod = 1;
    }
    return true;
  }

  private addItem(id: string, n: number): void {
    this.save.items[id] = (this.save.items[id] ?? 0) + n;
    this.discover(id);
  }

  private discover(id: string): void {
    if (!this.save.discovered.includes(id)) this.save.discovered.push(id);
  }

  private take(id: string, n: number): boolean {
    const have = this.save.items[id] ?? 0;
    if (have < n) return false;
    const left = have - n;
    if (left <= 0) delete this.save.items[id];
    else this.save.items[id] = left;
    return true;
  }

  private toast(m: string): void {
    this.toastMsg = m;
    this.toastT = 3.2;
  }

  private burst(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      this.sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 40,
        vy: 10 + Math.random() * 30,
        life: 0.5,
        color,
      });
    }
  }

  persist(): void {
    if (this.screen !== "play") return;
    const ok = writeSave(this.save);
    this.dirty = false;
    this.saveAcc = 0;
    if (ok) this.savedFlash = 1.6;
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(320, rect.width || 800);
    const cssH = Math.max(320, rect.height || 600);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let scale = 3;
    if (this.save.map === "in" && this.screen === "play") {
      scale = Math.max(2, Math.min(5, Math.floor(Math.min(cssW / (IW * TILE + 40), cssH / (IH * TILE + 96)))));
    } else {
      const tiles = cssW < 760 ? 15 : 22;
      scale = Math.max(2, Math.min(4, Math.floor(cssW / (tiles * TILE))));
    }
    if (cssW === this.cssW && cssH === this.cssH && dpr === this.dpr && scale === this.scale && this.canvas.width > 0) return;
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    this.scale = Math.max(2, scale);
    this.canvas.width = Math.floor(this.cssW * this.dpr);
    this.canvas.height = Math.floor(this.cssH * this.dpr);
  }

  private render(): void {
    const ctx = this.ctx;
    this.resize();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#1b2744";
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    const camX = Math.round(this.camX);
    const camY = Math.round(this.camY);
    ctx.save();
    ctx.translate(Math.round(this.cssW / 2), Math.round(this.cssH / 2));
    ctx.scale(this.scale, this.scale);
    ctx.translate(-camX, -camY);
    if (this.save.map === "in" && this.screen === "play") this.drawInterior(ctx);
    else this.drawOver(ctx);
    ctx.restore();
    this.drawLight(camX, camY);
    this.drawNames(camX, camY);
  }

  private drawOver(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.art.terrain, 0, 0);
    const t = this.anim;
    const x0 = Math.max(0, Math.floor((this.camX - this.cssW / this.scale) / TILE) - 2);
    const x1 = Math.min(MAP_W - 1, Math.ceil((this.camX + this.cssW / this.scale) / TILE) + 2);
    const y0 = Math.max(0, Math.floor((this.camY - this.cssH / this.scale) / TILE) - 2);
    const y1 = Math.min(MAP_H - 1, Math.ceil((this.camY + this.cssH / this.scale) / TILE) + 2);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (tileAt(this.world, x, y) !== WATER) continue;
        const shift = Math.floor(t * 10 + x) % 8;
        ctx.fillRect(x * TILE + shift, y * TILE + 5, 5, 1);
        ctx.fillRect(x * TILE + ((shift * 2) % 12), y * TILE + 11, 4, 1);
      }
    }
    const day = dayOf(this.save.time);
    for (const plot of this.world.plots) {
      if (plot.area === "extra" && this.save.harvests < 4) continue;
      const st = this.save.plots[plot.id];
      ctx.drawImage(this.art.plot, plot.tx * TILE, plot.ty * TILE);
      if (!st?.crop) continue;
      const need = CROP_DAYS[st.crop] ?? 1;
      const frame = st.stage >= need ? 3 : Math.min(3, st.stage);
      const sheet = this.art.crops[st.crop];
      if (sheet) ctx.drawImage(sheet[frame] ?? sheet[0]!, plot.tx * TILE, plot.ty * TILE - 6);
      if (st.wateredOnDay === day) {
        ctx.fillStyle = "rgba(40,80,140,0.25)";
        ctx.fillRect(plot.tx * TILE + 2, plot.ty * TILE + 2, 12, 12);
      }
    }
    for (let x = 3; x <= 14; x++) {
      for (const y of [23, 29]) {
        if (x === 10 && y === 29) continue;
        ctx.drawImage(this.art.fence, x * TILE, y * TILE - 8);
      }
    }
    ctx.drawImage(this.save.flags.fence ? this.art.fence : this.art.fenceBroken, 15 * TILE, 28 * TILE - 6);

    const cmds: Cmd[] = [];
    for (const tree of this.world.trees) {
      const spr = tree.pine ? this.art.pines[tree.seed % 4]! : this.art.trees[tree.seed % 4]!;
      const sway = Math.sin(t * 1.2 + tree.tx) > 0 ? 0 : 0;
      cmds.push({
        y: tree.ty * TILE + 16,
        draw: () => ctx.drawImage(spr, tree.tx * TILE + 8 - 20 + sway, tree.ty * TILE + 16 - 44),
      });
    }
    for (const rock of this.world.rocks) {
      const spr = this.art.rocks[rock.seed % 4]!;
      cmds.push({
        y: rock.ty * TILE + 14,
        draw: () => ctx.drawImage(spr, rock.tx * TILE, rock.ty * TILE + 2),
      });
    }
    for (const b of this.world.buildings) {
      const spr =
        b.kind === "cottage"
          ? this.art.cottage
          : b.kind === "cafe"
            ? this.art.cafe
            : b.kind === "workshop"
              ? this.art.workshop
              : b.kind === "house"
                ? this.art.house
                : this.art.fountain;
      const w = spr.width;
      const h = spr.height;
      cmds.push({
        y: b.ay,
        draw: () => {
          ctx.drawImage(spr, b.ax - w / 2, b.ay - h + 4);
          if (b.kind !== "fountain") {
            const puff = (t * 10 + b.ax) % 18;
            ctx.fillStyle = "rgba(244,244,240,0.65)";
            ctx.fillRect(b.ax + 18, b.ay - h + 8 - puff, 2, 2);
          }
        },
      });
    }
    for (const node of this.world.nodes) {
      if (!this.nodeUp(node.id)) continue;
      const spr = this.art.nodes[node.item];
      if (!spr) continue;
      const bob = Math.sin(t * 2 + node.x) * 1;
      cmds.push({ y: node.y, draw: () => ctx.drawImage(spr, node.x - 8, node.y - 16 + bob) });
    }
    for (const lamp of this.world.lamps) {
      cmds.push({ y: lamp.y, draw: () => ctx.drawImage(this.art.lamp, lamp.x - 5, lamp.y - 18) });
    }
    for (const c of this.critters) {
      if (c.kind === "sheep") cmds.push({ y: c.y, draw: () => ctx.drawImage(this.art.sheep, c.x - 10, c.y - 14) });
      if (c.kind === "duck") cmds.push({ y: c.y, draw: () => ctx.drawImage(this.art.duck, c.x - 8, c.y - 8) });
      if (c.kind === "cat") cmds.push({ y: c.y, draw: () => ctx.drawImage(this.art.cat, c.x - 8, c.y - 10) });
      if (c.kind === "butter") {
        const wing = Math.sin(t * 10 + c.a) > 0 ? 3 : 1;
        cmds.push({
          y: c.y,
          draw: () => {
            ctx.fillStyle = c.c ?? "#fff";
            ctx.fillRect(c.x - wing, c.y, wing, 2);
            ctx.fillRect(c.x + 1, c.y, wing, 2);
          },
        });
      }
      if (c.kind === "bird") {
        cmds.push({
          y: c.y,
          draw: () => {
            ctx.fillStyle = "#2a2118";
            ctx.fillRect(c.x, c.y, 2, 2);
            ctx.fillRect(c.x - 3, c.y + 1, 3, 1);
            ctx.fillRect(c.x + 2, c.y + 1, 3, 1);
          },
        });
      }
    }
    const frame = Math.floor(this.walkT * 6) % 2;
    for (const n of this.npcs) {
      const spr = this.art.npcs[n.id]?.[frame] ?? this.art.npcs[n.id]?.[0];
      if (!spr) continue;
      cmds.push({ y: n.y, draw: () => ctx.drawImage(spr, n.x - 8, n.y - 22) });
    }
    if (this.screen === "play") {
      const hero = this.art.hero[this.save.dir][this.speed > 4 ? frame : 0]!;
      cmds.push({
        y: this.save.y,
        draw: () => ctx.drawImage(hero, Math.round(this.save.x) - 8, Math.round(this.save.y) - 22),
      });
    }
    for (const s of this.sparks) {
      cmds.push({
        y: s.y,
        draw: () => {
          ctx.globalAlpha = Math.max(0, s.life * 2);
          ctx.fillStyle = s.color;
          ctx.fillRect(s.x, s.y, 2, 2);
          ctx.globalAlpha = 1;
        },
      });
    }
    cmds.sort((a, b) => a.y - b.y);
    for (const c of cmds) c.draw();
  }

  private drawInterior(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.art.interior, 0, 0);
    const cmds: Cmd[] = [];
    for (const f of this.save.furniture) {
      const spr = this.art.icons[f.item];
      const size = FURN_SIZE[f.item] ?? { w: 1, h: 1 };
      if (!spr) continue;
      const dx = f.tx * TILE + (size.w * TILE) / 2 - 8;
      const dy = f.ty * TILE + size.h * TILE - 18;
      cmds.push({ y: (f.ty + size.h) * TILE, draw: () => ctx.drawImage(spr, dx, dy) });
    }
    const frame = Math.floor(this.walkT * 6) % 2;
    const hero = this.art.hero[this.save.dir][this.speed > 4 ? frame : 0]!;
    cmds.push({
      y: this.save.y,
      draw: () => ctx.drawImage(hero, Math.round(this.save.x) - 8, Math.round(this.save.y) - 22),
    });
    cmds.sort((a, b) => a.y - b.y);
    for (const c of cmds) c.draw();
    if (!this.save.flags.hearth) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.strokeRect(4, 4, 10, 8);
      ctx.strokeRect(20, 2, 8, 6);
    }
  }

  private drawLight(camX: number, camY: number): void {
    const { alpha, color } = lightFor(this.screen === "title" ? 0.34 : phaseOf(this.save.time));
    if (alpha < 0.03) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    const sx = (this.save.x - camX) * this.scale + this.cssW / 2;
    const sy = (this.save.y - camY) * this.scale + this.cssH / 2;
    const rad = Math.max(48, (70 + (1 - alpha) * 80) * (this.scale / 3));
    const g = ctx.createRadialGradient(sx, sy, rad * 0.15, sx, sy, rad);
    g.addColorStop(0, "rgba(0,0,0,0.95)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(0.45, alpha);
    const warm = ctx.createRadialGradient(sx, sy, 8, sx, sy, rad * 0.7);
    warm.addColorStop(0, "rgba(255,210,140,0.9)");
    warm.addColorStop(1, "rgba(255,180,80,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    if (alpha > 0.2 && this.save.map === "over") {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#ffe1a0";
      for (const b of this.world.buildings) {
        for (const w of b.windows) {
          const wx = (w.x - camX) * this.scale + this.cssW / 2;
          const wy = (w.y - camY) * this.scale + this.cssH / 2;
          ctx.fillRect(wx, wy, 6, 5);
        }
      }
      for (const lamp of this.world.lamps) {
        const lx = (lamp.x - camX) * this.scale + this.cssW / 2;
        const ly = (lamp.y - 14 - camY) * this.scale + this.cssH / 2;
        ctx.fillRect(lx, ly, 4, 4);
      }
    }
    ctx.restore();
  }

  private drawNames(camX: number, camY: number): void {
    if (this.screen !== "play" || this.save.map !== "over" || this.panel !== "none") return;
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = "700 13px Nunito, sans-serif";
    ctx.textAlign = "center";
    for (const n of this.npcs) {
      if (Math.hypot(n.x - this.save.x, n.y - this.save.y) > 70) continue;
      const sx = (n.x - camX) * this.scale + this.cssW / 2;
      const sy = (n.y - 28 - camY) * this.scale + this.cssH / 2;
      ctx.fillStyle = "rgba(246,237,216,0.92)";
      ctx.fillRect(sx - 46, sy - 12, 92, 18);
      ctx.fillStyle = "#2a2118";
      ctx.fillText(n.name, sx, sy + 2);
    }
    ctx.restore();
  }

  private icon(id: string): string {
    const hit = this.urls.get(id);
    if (hit) return hit;
    const url = iconUrl(this.art, id);
    this.urls.set(id, url);
    return url;
  }

  snapshot(): ViewState {
    const time = this.save.time;
    const inv = Object.entries(this.save.items)
      .filter(([, n]) => n > 0)
      .map(([id, qty]) => {
        const def = ITEM[id];
        return {
          id,
          name: def?.name ?? id,
          qty,
          blurb: def?.blurb ?? "",
          cat: def?.cat ?? "forage",
          icon: this.icon(id),
        };
      });
    const shopKind = this.panel === "shop" ? "cafe" : this.panel === "workshop" ? "wood" : null;
    const goods =
      shopKind === "cafe"
        ? ITEMS.filter((i) => i.cat === "seed" && i.buy).map((i) => ({ id: i.id, name: i.name, price: i.buy! }))
        : shopKind === "wood"
          ? ITEMS.filter((i) => i.cat === "furn" && i.buy).map((i) => ({ id: i.id, name: i.name, price: i.buy! }))
          : [];
    const sellables = inv
      .filter((i) => (ITEM[i.id]?.sell ?? 0) > 0)
      .map((i) => ({ id: i.id, name: i.name, price: ITEM[i.id]!.sell, qty: i.qty }));
    const here = this.screen === "play" ? regionName(this.save.x, this.save.y, this.save.map) : "Little Lantern Village";
    const bookPool =
      this.bookTab === "stories"
        ? Object.entries(LORE).map(([id, lore]) => ({
            id,
            name: lore.title,
            blurb: lore.text,
            known: this.save.lore.includes(id),
            count: this.save.lore.includes(id) ? 1 : 0,
          }))
        : this.bookTab === "fish"
          ? FISH.map((f) => ({
              id: f.id,
              name: this.save.fish[f.id] ? (ITEM[f.id]?.name ?? f.id) : "???",
              blurb: this.save.fish[f.id] ? (ITEM[f.id]?.blurb ?? "") : "The lake has not introduced you.",
              known: !!this.save.fish[f.id],
              count: this.save.fish[f.id] ?? 0,
            }))
          : ITEMS.filter((i) => i.cat === this.bookTab).map((i) => ({
              id: i.id,
              name: this.save.discovered.includes(i.id) ? i.name : "???",
              blurb: this.save.discovered.includes(i.id) ? i.blurb : "Still out in the valley.",
              known: this.save.discovered.includes(i.id),
              count: this.save.items[i.id] ?? (this.save.discovered.includes(i.id) ? 1 : 0),
            }));
    return {
      screen: this.screen,
      panel: this.fishing ? "none" : this.panel,
      hasSave: hasSave(),
      day: dayOf(time),
      clock: clockOf(time),
      phaseName: phaseName(time),
      coins: this.save.coins,
      location: here,
      prompt: this.prompt(),
      toast: this.toastMsg,
      saved: this.savedFlash > 0,
      dialogue: this.dialogue,
      inv,
      selected: this.selected,
      quests: questsOf(this.save),
      bookTab: this.bookTab,
      book: bookPool,
      shopKind,
      goods,
      sellables,
      seeds: inv.filter((i) => i.cat === "seed").map((i) => ({ id: i.id, name: i.name, qty: i.qty })),
      settings: this.save.settings,
      decorate: this.decorate,
      furnPick: this.furnPick,
      fishing: this.fishing,
      fishZone: this.zone,
      fishWidth: this.zoneW,
      caught: Object.values(this.save.fish).reduce((a, b) => a + b, 0),
      regionCards: REGIONS.filter((r) => r.name !== "Lantern Clearing" || this.save.regions.includes(r.name)).map((r) => ({
        name: this.save.regions.includes(r.name) ? r.name : "Somewhere quiet",
        blurb: this.save.regions.includes(r.name) ? r.blurb : "Walk there when you like.",
        known: this.save.regions.includes(r.name),
        here: here === r.name,
      })),
    };
  }

  private emit(): void {
    if (!this.alive) return;
    this.onChange(this.snapshot());
  }

  private expose(): void {
    window.__controlsTest = {
      getYaw: () => this.heading,
      getSpeed: () => this.speed,
      getX: () => this.save.x,
      getY: () => this.save.y,
      setKeys: (codes: string[]) => {
        this.keys = new Set(codes);
      },
    };
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}
