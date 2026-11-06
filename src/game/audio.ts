export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private water: GainNode | null = null;
  private timer = 0;
  private beat = 0;
  musicVol = 0.7;
  sfxVol = 0.8;
  private night = false;
  private started = false;

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx({ latencyHint: "interactive" });
      this.ctx = ctx;
      const master = ctx.createGain();
      const music = ctx.createGain();
      const sfx = ctx.createGain();
      const water = ctx.createGain();
      music.connect(master);
      sfx.connect(master);
      water.connect(sfx);
      master.connect(ctx.destination);
      this.master = master;
      this.music = music;
      this.sfx = sfx;
      this.water = water;
      water.gain.value = 0;
      this.apply();
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 600;
      src.connect(filter);
      filter.connect(water);
      src.start();
      this.started = true;
      this.loop();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVol = music / 100;
    this.sfxVol = sfx / 100;
    this.apply();
  }

  private apply(): void {
    const now = this.ctx?.currentTime ?? 0;
    this.music?.gain.setTargetAtTime(this.musicVol * this.musicVol * 0.9, now, 0.05);
    this.sfx?.gain.setTargetAtTime(this.sfxVol * this.sfxVol, now, 0.05);
  }

  setAmbience(phase: number, nearWater: boolean): void {
    this.night = phase < 0.22 || phase > 0.8;
    const now = this.ctx?.currentTime ?? 0;
    const target = nearWater ? 0.12 : 0;
    this.water?.gain.setTargetAtTime(target, now, 0.15);
  }

  private loop = (): void => {
    if (!this.ctx || !this.music) return;
    const day = [262, 330, 392, 494, 440, 330, 392, 523];
    const dusk = [220, 262, 330, 392, 349, 262, 294, 440];
    const notes = this.night ? dusk : day;
    const f = notes[this.beat % notes.length] ?? 330;
    this.tone(f, this.night ? 0.45 : 0.28, "triangle", this.music, 0.05);
    if (this.beat % 2 === 0) this.tone(f / 2, 0.55, "sine", this.music, 0.03);
    this.beat++;
    this.timer = window.setTimeout(this.loop, this.night ? 1080 : 760);
  };

  private tone(freq: number, dur: number, type: OscillatorType, bus: GainNode, vel: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vel), t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vel: number, freq = 800): void {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = vel;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
  }

  step(): void {
    this.noise(0.06, 0.18, 180 + Math.random() * 80);
  }
  collect(): void {
    if (!this.music) return;
    this.tone(660, 0.1, "sine", this.sfx!, 0.08);
    this.tone(880, 0.16, "sine", this.sfx!, 0.06);
  }
  talk(): void {
    this.tone(520, 0.08, "sine", this.sfx!, 0.05);
  }
  splash(): void {
    this.noise(0.15, 0.2, 500);
  }
  plant(): void {
    this.tone(420, 0.12, "triangle", this.sfx!, 0.06);
  }
  chirp(): void {
    this.tone(1400 + Math.random() * 400, 0.09, "sine", this.sfx!, 0.03);
    this.tone(1800, 0.07, "sine", this.sfx!, 0.02);
  }
  cricket(): void {
    this.tone(3200, 0.03, "square", this.sfx!, 0.01);
  }

  destroy(): void {
    window.clearTimeout(this.timer);
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }

  get alive(): boolean {
    return this.started;
  }
}
