import { useEffect, useRef, useState } from "react";
import { Backpack, BookOpen, Flower2, Map as MapIcon, Pause, X } from "lucide-react";
import { Game } from "@/game/engine";
import { MAP_H, MAP_W, TILE, type ViewState } from "@/game/types";

export function LanternGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const bobRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<ViewState | null>(null);
  const [armNew, setArmNew] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(canvas, setView);
    gameRef.current = game;
    game.start();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!view?.fishing) return;
    let id = 0;
    const tick = () => {
      const game = gameRef.current;
      const el = bobRef.current;
      if (game && el) el.style.left = `${game.bob * 100}%`;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [view?.fishing]);

  useEffect(() => {
    if (view?.panel !== "map") return;
    const canvas = miniRef.current;
    const game = gameRef.current;
    if (!canvas || !game) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 220;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(game.art.terrain, 0, 0, 320, 220);
    if (game.save.map === "over") {
      ctx.fillStyle = "#a33d38";
      ctx.fillRect((game.save.x / (MAP_W * TILE)) * 320 - 3, (game.save.y / (MAP_H * TILE)) * 220 - 3, 6, 6);
    }
  }, [view?.panel, view?.location, view?.day]);

  const game = gameRef.current;
  const hold = (code: string, down: boolean) => gameRef.current?.setHold(code, down);

  return (
    <div className="game-root">
      <canvas ref={canvasRef} aria-label="Little Lantern Village" />
      <div className="overlay">
        {view?.screen === "play" && view.panel === "none" && !view.fishing && (
          <>
            <div className="hud-top">
              <div className="chip">
                Day {view.day} · {view.phaseName} · {view.clock}
              </div>
              <div className="chip">{view.coins} coins</div>
            </div>
            <div className="hud-bottom">
              <div className="chip">{view.location}</div>
              {view.prompt && <div className="prompt">E · {view.prompt}</div>}
              <div className="hud-actions">
                <button className="icon-btn" aria-label="Pack" onClick={() => gameRef.current?.setPanel("inventory")}>
                  <Backpack size={18} />
                </button>
                <button className="icon-btn" aria-label="Journal" onClick={() => gameRef.current?.setPanel("journal")}>
                  <BookOpen size={18} />
                </button>
                <button className="icon-btn" aria-label="Map" onClick={() => gameRef.current?.setPanel("map")}>
                  <MapIcon size={18} />
                </button>
                <button className="icon-btn" aria-label="Pause" onClick={() => gameRef.current?.setPanel("pause")}>
                  <Pause size={18} />
                </button>
              </div>
            </div>
          </>
        )}
        {view?.toast && <div className="toast">{view.toast}</div>}
        {view?.saved && <div className="saved">Saved</div>}

        {(!view || view.screen === "title") && (
          <div className="title-wrap">
            <div className="title-card">
              <div className="lantern" aria-hidden="true">
                <span className="lantern-cap" />
                <span className="lantern-body" />
              </div>
              <p className="eyebrow">A COZY LIFE</p>
              <h1>Little Lantern Village</h1>
              <p className="lede">A little world to wander slowly. Garden, fish, and sit with the neighbors. Nothing expires.</p>
              <div className="stack">
                <button
                  className="btn primary"
                  onClick={() => {
                    if (view?.hasSave && !armNew) {
                      setArmNew(true);
                      return;
                    }
                    gameRef.current?.newGame();
                    setArmNew(false);
                  }}
                >
                  {armNew ? "Replace the saved game" : "New game"}
                </button>
                <button className="btn" disabled={!view?.hasSave} onClick={() => gameRef.current?.continue()}>
                  Continue
                </button>
                <button className="btn" onClick={() => gameRef.current?.setPanel("settings")}>
                  Settings
                </button>
              </div>
              <p className="hint">WASD or arrows to walk. E to interact. I pack, J journal, M map, C collection, Esc pause.</p>
            </div>
          </div>
        )}

        {view?.fishing && (
          <div className="scrim">
            <div className="fish-card">
              <h2>The bobber settles</h2>
              <p className="sub">Reel when the mark sits in the warm band. A miss only means try again.</p>
              <div className="track">
                <div className="zone" style={{ left: `${view.fishZone * 100}%`, width: `${view.fishWidth * 100}%` }} />
                <div className="bob" ref={bobRef} />
              </div>
              <button className="btn primary" onClick={() => gameRef.current?.reel()}>
                Reel
              </button>
            </div>
          </div>
        )}

        {view && view.panel !== "none" && !view.fishing && (
          <div className="scrim" onClick={() => gameRef.current?.closePanel()}>
            <div className="panel" onClick={(e) => e.stopPropagation()} role="dialog">
              <div className="panel-head">
                <div>
                  <h2>
                    {view.panel === "inventory" && "Pack"}
                    {view.panel === "journal" && "Journal"}
                    {view.panel === "map" && "Village map"}
                    {view.panel === "book" && "Collection"}
                    {view.panel === "settings" && "Settings"}
                    {view.panel === "pause" && "Paused"}
                    {view.panel === "shop" && "Cafe counter"}
                    {view.panel === "workshop" && "Workshop"}
                    {view.panel === "seeds" && "Choose seeds"}
                    {view.panel === "dialogue" && (view.dialogue?.name ?? "Hello")}
                  </h2>
                  {view.panel === "journal" && <p className="sub">Nothing expires. Wander in any order.</p>}
                  {view.panel === "inventory" && <p className="sub">The watering can and rod stay with you.</p>}
                </div>
                <button className="icon-btn" aria-label="Close" onClick={() => gameRef.current?.closePanel()}>
                  <X size={18} />
                </button>
              </div>

              {view.panel === "dialogue" && view.dialogue && (
                <>
                  <p className="who">{view.dialogue.name}</p>
                  <p className="speak">{view.dialogue.text}</p>
                  <div className="choices">
                    {view.dialogue.choices.map((c) => (
                      <button key={c.id} className={c.id === "close" ? "btn" : "btn primary"} onClick={() => game?.choose(c.id)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {view.panel === "inventory" && (
                <>
                  <div className="grid-items">
                    {view.inv.length === 0 && <p className="sub">Your pack is light. The valley will offer things.</p>}
                    {view.inv.map((item) => (
                      <button key={item.id} className={view.selected === item.id ? "slot on" : "slot"} onClick={() => game?.select(item.id)}>
                        {item.icon && <img src={item.icon} alt="" />}
                        <b>
                          {item.name} ×{item.qty}
                        </b>
                      </button>
                    ))}
                  </div>
                  {view.selected && (
                    <div className="detail">
                      <div>
                        <strong>{view.inv.find((i) => i.id === view.selected)?.name}</strong>
                        <p>{view.inv.find((i) => i.id === view.selected)?.blurb}</p>
                      </div>
                      {view.decorate && view.furnPick === view.selected && <span>Selected to place</span>}
                    </div>
                  )}
                  {view.location === "Rowan Cottage" && (
                    <div className="row-btns">
                      <button className="btn" onClick={() => game?.toggleDecorate()}>
                        {view.decorate ? "Stop arranging" : "Arrange the room"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {view.panel === "journal" &&
                view.quests.map((q) => (
                  <article key={q.id} className={q.done ? "quest done" : "quest"}>
                    <h3>{q.done ? "Done · " : ""}{q.title}</h3>
                    <p>{q.desc}</p>
                  </article>
                ))}

              {view.panel === "map" && (
                <>
                  <canvas ref={miniRef} className="mini" width={320} height={220} />
                  <div className="regions">
                    {view.regionCards.map((r) => (
                      <div key={r.name + r.blurb} className={r.known ? "region" : "region dim"}>
                        <strong>{r.here ? `${r.name} · you are here` : r.name}</strong>
                        <span>{r.blurb}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {view.panel === "book" && (
                <>
                  <div className="tabs">
                    {(["forage", "crop", "fish", "stories"] as const).map((tab) => (
                      <button key={tab} className={view.bookTab === tab ? "tab on" : "tab"} onClick={() => game?.setBook(tab)}>
                        {tab === "forage" ? "Valley" : tab === "crop" ? "Garden" : tab === "fish" ? "Lake" : "Stories"}
                      </button>
                    ))}
                  </div>
                  <div className="grid-items">
                    {view.book.map((entry) => (
                      <button key={entry.id} className={view.selected === entry.id ? "slot on" : "slot"} onClick={() => game?.select(entry.id)}>
                        <Flower2 size={16} />
                        <b>{entry.known ? entry.name : "Unknown"}</b>
                      </button>
                    ))}
                  </div>
                  {view.selected && (
                    <div className="detail">
                      <div>
                        <strong>{view.book.find((b) => b.id === view.selected)?.name}</strong>
                        <p>{view.book.find((b) => b.id === view.selected)?.blurb}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(view.panel === "shop" || view.panel === "workshop") && (
                <>
                  <p className="sub">{view.coins} coins warm in your pocket.</p>
                  <div className="choices">
                    {view.goods.map((g) => (
                      <button key={g.id} className="btn" onClick={() => game?.buy(g.id)}>
                        Buy {g.name} · {g.price}
                      </button>
                    ))}
                  </div>
                  <h3>Sell</h3>
                  <div className="choices">
                    {view.sellables.length === 0 && <p className="sub">Nothing to sell just now.</p>}
                    {view.sellables.map((g) => (
                      <button key={g.id} className="btn" onClick={() => game?.sell(g.id)}>
                        Sell {g.name} · {g.price} ({g.qty})
                      </button>
                    ))}
                  </div>
                </>
              )}

              {view.panel === "seeds" && (
                <div className="choices">
                  {view.seeds.map((s) => (
                    <button key={s.id} className="btn primary" onClick={() => game?.plant(s.id)}>
                      Plant {s.name} · {s.qty}
                    </button>
                  ))}
                </div>
              )}

              {view.panel === "settings" && (
                <>
                  <label className="slider">
                    Music {view.settings.music}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={view.settings.music}
                      onChange={(e) => gameRef.current?.setVolumes(Number(e.target.value), view.settings.sfx)}
                    />
                  </label>
                  <label className="slider">
                    Effects {view.settings.sfx}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={view.settings.sfx}
                      onChange={(e) => gameRef.current?.setVolumes(view.settings.music, Number(e.target.value))}
                    />
                  </label>
                  <p className="sub">Music and effects are separate. Progress stays on this device.</p>
                </>
              )}

              {view.panel === "pause" && (
                <>
                  <ul className="help-list">
                    <li>WASD or arrows walk. A is left, D is right.</li>
                    <li>E or Space interacts. Click the world to use what you are near.</li>
                    <li>I pack, J journal, M map, C collection, R arrange inside.</li>
                    <li>Sleep in the bed to reach the next morning. Crops never die.</li>
                  </ul>
                  <div className="row-btns">
                    <button className="btn primary" onClick={() => game?.closePanel()}>
                      Resume
                    </button>
                    <button className="btn" onClick={() => game?.setPanel("book")}>
                      Collection
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        game?.persist();
                        game?.setPanel("settings");
                      }}
                    >
                      Save & settings
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        game?.persist();
                        window.location.reload();
                      }}
                    >
                      Save & title
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="touch">
        <div className="pad">
          <button className="touch-btn up" aria-label="Up" onPointerDown={() => hold("KeyW", true)} onPointerUp={() => hold("KeyW", false)} onPointerLeave={() => hold("KeyW", false)}>
            ↑
          </button>
          <button className="touch-btn left" aria-label="Left" onPointerDown={() => hold("KeyA", true)} onPointerUp={() => hold("KeyA", false)} onPointerLeave={() => hold("KeyA", false)}>
            ←
          </button>
          <button className="touch-btn down" aria-label="Down" onPointerDown={() => hold("KeyS", true)} onPointerUp={() => hold("KeyS", false)} onPointerLeave={() => hold("KeyS", false)}>
            ↓
          </button>
          <button className="touch-btn right" aria-label="Right" onPointerDown={() => hold("KeyD", true)} onPointerUp={() => hold("KeyD", false)} onPointerLeave={() => hold("KeyD", false)}>
            →
          </button>
        </div>
        <div className="touch-actions">
          <button className="touch-btn" aria-label="Interact" onClick={() => gameRef.current?.pressE()}>
            E
          </button>
          <button className="touch-btn" aria-label="Pack" onClick={() => gameRef.current?.setPanel("inventory")}>
            Bag
          </button>
        </div>
      </div>
    </div>
  );
}
