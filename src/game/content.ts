import type { Choice, ItemDef, QuestView, SaveData, Talk } from "./types";

export const ITEMS: ItemDef[] = [
  { id: "daisy", name: "Daisy", blurb: "A small meadow hello.", cat: "forage", sell: 12 },
  { id: "tulip", name: "Tulip", blurb: "Cupped and a little shy.", cat: "forage", sell: 14 },
  { id: "poppy", name: "Poppy", blurb: "A red flag in the grass.", cat: "forage", sell: 14 },
  { id: "mushroom", name: "Inkcap", blurb: "Sable swears it makes gentle ink.", cat: "forage", sell: 16 },
  { id: "berry", name: "Brumbleberry", blurb: "Tart, and stains your thumb purple.", cat: "forage", sell: 10 },
  { id: "herb", name: "River mint", blurb: "Cool even on a warm path.", cat: "forage", sell: 10 },
  { id: "feather", name: "Soft feather", blurb: "A duck left it on purpose, maybe.", cat: "forage", sell: 8 },
  { id: "shell", name: "Lake shell", blurb: "Spiral, and faintly blue inside.", cat: "forage", sell: 18 },
  { id: "sketch", name: "Nest sketch", blurb: "You left the nest where it was.", cat: "forage", sell: 0 },
  { id: "wood", name: "Kindling", blurb: "Dry, and still smells like rain.", cat: "forage", sell: 4 },
  { id: "stone", name: "Smooth stone", blurb: "The lake has been polishing this.", cat: "forage", sell: 3 },
  { id: "turnip", name: "Turnip", blurb: "Crisp and honest.", cat: "crop", sell: 28 },
  { id: "tomato", name: "Sun tomato", blurb: "Warm from the vine.", cat: "crop", sell: 42 },
  { id: "bloom", name: "Lanternbloom", blurb: "It glows faintly after dusk.", cat: "crop", sell: 75 },
  { id: "fish_minnow", name: "Brook minnow", blurb: "A quick silver wink.", cat: "fish", sell: 18 },
  { id: "fish_perch", name: "Reed perch", blurb: "Striped and curious.", cat: "fish", sell: 30 },
  { id: "fish_koi", name: "Lantern koi", blurb: "It glows like a window at dusk.", cat: "fish", sell: 55 },
  { id: "fish_eel", name: "Dusk eel", blurb: "Slippery as a rumor.", cat: "fish", sell: 48 },
  { id: "fish_carp", name: "Moon carp", blurb: "Only quiet water knows it.", cat: "fish", sell: 80 },
  { id: "seed_daisy", name: "Daisy seeds", blurb: "Ready for a bed or a verge.", cat: "seed", sell: 0, buy: 15 },
  { id: "seed_turnip", name: "Turnip seeds", blurb: "A reliable first crop.", cat: "seed", sell: 0, buy: 20 },
  { id: "seed_tomato", name: "Tomato seeds", blurb: "Needs a few calm days.", cat: "seed", sell: 0, buy: 35 },
  { id: "seed_bloom", name: "Lanternbloom seeds", blurb: "Rare, and a little magical.", cat: "seed", sell: 0, buy: 80 },
  { id: "furn_chair", name: "Oak chair", blurb: "A seat with a good view of the window.", cat: "furn", sell: 10, buy: 40 },
  { id: "furn_table", name: "Kitchen table", blurb: "Enough room for bread and letters.", cat: "furn", sell: 10, buy: 70 },
  { id: "furn_lamp", name: "Cottage lamp", blurb: "Warm light for late reading.", cat: "furn", sell: 10, buy: 50 },
  { id: "furn_shelf", name: "Book shelf", blurb: "For poems, seeds, and found feathers.", cat: "furn", sell: 10, buy: 55 },
  { id: "furn_plant", name: "Potted fern", blurb: "Happiest near a window.", cat: "furn", sell: 8, buy: 30 },
  { id: "furn_cushion", name: "Window cushion", blurb: "For sitting on the floor with tea.", cat: "furn", sell: 8, buy: 25 },
  { id: "relic_lantern", name: "Old lantern", blurb: "The clearing was keeping it safe.", cat: "relic", sell: 0 },
];

export const ITEM: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const FURN_SIZE: Record<string, { w: number; h: number; block: boolean }> = {
  furn_bed: { w: 2, h: 2, block: true },
  furn_stove: { w: 1, h: 1, block: true },
  furn_chest: { w: 1, h: 1, block: true },
  furn_rug: { w: 2, h: 2, block: false },
  furn_chair: { w: 1, h: 1, block: true },
  furn_table: { w: 2, h: 1, block: true },
  furn_lamp: { w: 1, h: 1, block: true },
  furn_shelf: { w: 1, h: 1, block: true },
  furn_plant: { w: 1, h: 1, block: true },
  furn_cushion: { w: 1, h: 1, block: false },
};

export const CROP_DAYS: Record<string, number> = { daisy: 1, turnip: 2, tomato: 3, bloom: 3 };
export const SEED_TO_CROP: Record<string, string> = {
  seed_daisy: "daisy",
  seed_turnip: "turnip",
  seed_tomato: "tomato",
  seed_bloom: "bloom",
};

export const FISH = [
  { id: "fish_minnow", w: 40 },
  { id: "fish_perch", w: 28 },
  { id: "fish_koi", w: 16 },
  { id: "fish_eel", w: 10 },
  { id: "fish_carp", w: 6 },
];

export const LORE: Record<string, { title: string; text: string }> = {
  letter: {
    title: "Grandma Rowan's letter",
    text: "Little lantern — the cottage is yours. It creaks, but the creaks are friendly. I left seeds in the tin. If the village feels quiet, it is only resting. Speak to Lior by the fountain when you are ready. There is no hurry. There never was.",
  },
  mill: {
    title: "The mill that slept",
    text: "Lior says the old river mill dimmed one winter, and the paths grew confusing after dark. The village did not argue with the dark. They hung lanterns, so nobody was lost between the meadow and the lake. The light was a promise, not a warning.",
  },
  poem: {
    title: "Inkcap evening",
    text: "Sable's poem: The mushrooms write in rings. The pines repeat them softly. If you are late, the lanterns keep your place.",
  },
  initials: {
    title: "L + R",
    text: "By the still pond, a stone reads L + R — the summer the lanterns came home. Nobody in the square will say who they were. They smile instead.",
  },
  nest: {
    title: "The speckled nest",
    text: "You sketched the meadow nest and left it be. Some collections are better as looking.",
  },
  fence: {
    title: "A mended edge",
    text: "The garden fence had been practicing falling over. With a little kindling and Tomas's patience, it stands again, and the yard feels held.",
  },
  mira: {
    title: "Fountain daisies",
    text: "Mira planted your daisies along the fountain path. She says flowers remember who carried them.",
  },
};

export const REGIONS: { name: string; blurb: string }[] = [
  { name: "Cottage Garden", blurb: "Your yard, your beds, and a door that knows you." },
  { name: "Little Lantern Village", blurb: "Fountain, cafe, workshop, and unhurried neighbors." },
  { name: "Pinewhisper Forest", blurb: "Tall pines, mushrooms, and a clearing that keeps secrets." },
  { name: "Lantern Lake", blurb: "A dock, ducks, and water that is happy to wait." },
  { name: "Buttercup Meadow", blurb: "Sheep, wildflowers, and a good place to do nothing." },
  { name: "Lantern Clearing", blurb: "A hidden ring of mushrooms north of the pines." },
];

const close = (label = "Close"): Choice => ({ id: "close", label, effects: [] });

function met(s: SaveData, id: string): boolean {
  return !!s.flags[`met_${id}`];
}
function qty(s: SaveData, id: string): number {
  return s.items[id] ?? 0;
}
function fishTotal(s: SaveData): number {
  return Object.values(s.fish).reduce((a, b) => a + b, 0);
}
function fishInPack(s: SaveData): number {
  return FISH.reduce((a, f) => a + (s.items[f.id] ?? 0), 0);
}

export function talkTo(id: string, s: SaveData): Talk {
  if (id === "lior") {
    if (!met(s, "lior")) {
      return {
        name: "Elder Lior",
        text: "You have Rowan's walk. The fountain still remembers every wish. Most of them were small. Those are the ones that last.",
        choices: [
          {
            id: "ask",
            label: "The cottage feels half asleep.",
            effects: [{ t: "flag", k: "met_lior" }],
            say: "North of the pines is a clearing where mushrooms grow in a ring. Something of ours was left there when the mill went quiet. Bring it back if you find it. Or don't, and tell me about the ducks instead.",
          },
        ],
      };
    }
    if (s.flags.lantern && !s.flags.q_lior) {
      return {
        name: "Elder Lior",
        text: "Ah. You found the old lantern. May I tell you why the village still lights them?",
        choices: [
          {
            id: "hear",
            label: "Please do.",
            effects: [
              { t: "flag", k: "q_lior" },
              { t: "lore", id: "mill" },
              { t: "item", id: "furn_lamp", n: 1 },
              { t: "toast", m: "Lior gives you a cottage lamp." },
            ],
            say: "When the mill slept, the paths forgot themselves at dusk. We hung lanterns so no one was lost between the meadow and the lake. Keep a lamp in the cottage. Light is how this place says welcome back.",
          },
        ],
      };
    }
    return {
      name: "Elder Lior",
      text: s.flags.q_lior
        ? "The square is kinder with you in it. Stay as long as the afternoon does."
        : "The clearing is north, where the mushroom ring is. There is no clock on it.",
      choices: [close("I'll wander.")],
    };
  }
  if (id === "mira") {
    if (!met(s, "mira")) {
      return {
        name: "Mira Bloom",
        text: "Oh, the cottage woke up. I'm Mira. Your soil isn't abandoned. It's just shy. Water it, and it will remember how to grow.",
        choices: [
          {
            id: "hi",
            label: "I have a few seeds.",
            effects: [{ t: "flag", k: "met_mira" }],
            say: "Daisies like company. If you ever have three to spare, I would love to border the fountain path. Whenever that is.",
          },
        ],
      };
    }
    if (!s.flags.q_mira && qty(s, "daisy") >= 3) {
      return {
        name: "Mira Bloom",
        text: "Those daisies look ready for a walk to the fountain. Only if you can part with them.",
        choices: [
          {
            id: "give",
            label: "Give three daisies",
            effects: [
              { t: "take", id: "daisy", n: 3 },
              { t: "flag", k: "q_mira" },
              { t: "coin", n: 80 },
              { t: "item", id: "seed_bloom", n: 1 },
              { t: "lore", id: "mira" },
              { t: "toast", m: "Mira presses lanternbloom seeds into your hand." },
            ],
            say: "I'll tuck them along the path tonight. And these seeds — they glow a little, like the old lanterns. Plant them when the week feels kind.",
          },
          { id: "later", label: "Maybe later", effects: [], say: "They'll keep. Flowers are patient. So am I." },
        ],
      };
    }
    return {
      name: "Mira Bloom",
      text: s.flags.q_mira
        ? "The fountain path looks like itself again. Thank you for the daisies."
        : "Three daisies, when the meadow feels generous. No hurry at all. Water anything you plant, then sleep — morning does the rest.",
      choices: [close("Happy growing.")],
    };
  }
  if (id === "tomas") {
    if (!met(s, "tomas")) {
      return {
        name: "Tomas Reed",
        text: "Tomas. I keep the workshop from wandering off. Wood remembers the tree. Try to be a good memory.",
        choices: [
          {
            id: "hi",
            label: "The garden fence is leaning.",
            effects: [{ t: "flag", k: "met_tomas" }],
            say: "I noticed. Six pieces of kindling would set it right, if you bring them to the gap yourself. And if you ever have eight more, I can spare a chair.",
          },
          { id: "shop", label: "See the furniture", effects: [{ t: "flag", k: "met_tomas" }], shop: "wood" },
        ],
      };
    }
    if (!s.flags.q_tomas && qty(s, "wood") >= 8) {
      return {
        name: "Tomas Reed",
        text: "That's a friendly armful of kindling. I could turn the afternoon into a chair.",
        choices: [
          {
            id: "give",
            label: "Leave eight kindling",
            effects: [
              { t: "take", id: "wood", n: 8 },
              { t: "flag", k: "q_tomas" },
              { t: "item", id: "furn_chair", n: 1 },
              { t: "toast", m: "Tomas slides you a finished oak chair." },
            ],
            say: "There. It doesn't wobble. Put it where the light is good.",
          },
          { id: "shop", label: "Just browsing", effects: [], shop: "wood" },
        ],
      };
    }
    return {
      name: "Tomas Reed",
      text: s.flags.q_tomas
        ? "The chair will outlast my jokes. That is the idea."
        : "Eight kindling, if a chair sounds nice. The fence only needs six, and it likes to be mended in person.",
      choices: [
        { id: "shop", label: "See the workshop", effects: [], shop: "wood" },
        close("I'll stroll."),
      ],
    };
  }
  if (id === "hana") {
    if (!met(s, "hana")) {
      return {
        name: "Hana Sol",
        text: "Sit if you like. I'm Hana. The chairs don't mind quiet company, and the soup doesn't mind fish.",
        choices: [
          {
            id: "hi",
            label: "What are you cooking?",
            effects: [{ t: "flag", k: "met_hana" }],
            say: "Something that would be happier with two fish in it. Any kind. The lake is not a test. And the counter is open whenever you want seeds or a sale.",
          },
          { id: "shop", label: "See the counter", effects: [{ t: "flag", k: "met_hana" }], shop: "cafe" },
        ],
      };
    }
    if (!s.flags.q_hana && fishInPack(s) >= 2) {
      return {
        name: "Hana Sol",
        text: "You smell faintly of lake, in a good way. Two fish would make the pot sing.",
        choices: [
          {
            id: "give",
            label: "Share two fish",
            effects: [
              { t: "flag", k: "q_hana" },
              { t: "coin", n: 100 },
              { t: "toast", m: "Hana pays you fairly and saves you a bowl." },
            ],
            say: "I'll take them from your pack — the two most recently admired. Come back when you want the counter. The cafe feels fuller already.",
          },
        ],
      };
    }
    return {
      name: "Hana Sol",
      text: s.flags.q_hana
        ? "The soup remembers you. Stay for the smell, at least."
        : "Two fish, any fish, when you feel like casting a line. Missing a reel only means the water blinked.",
      choices: [
        { id: "shop", label: "Open the counter", effects: [], shop: "cafe" },
        close("Maybe a little later."),
      ],
    };
  }
  if (id === "sable") {
    if (!met(s, "sable")) {
      return {
        name: "Sable Quill",
        text: "The notices are suggestions, not summons. I'm Sable. I write them so the board has a voice.",
        choices: [
          {
            id: "hi",
            label: "Anything gentle on the board?",
            effects: [{ t: "flag", k: "met_sable" }],
            say: "A mushroom would unstick my ink. An inkcap, from the forest shade. If you see one and don't need it, I have a poem waiting.",
          },
        ],
      };
    }
    if (!s.flags.q_sable && qty(s, "mushroom") >= 1) {
      return {
        name: "Sable Quill",
        text: "Is that an inkcap? It has the right darkness.",
        choices: [
          {
            id: "give",
            label: "Offer the inkcap",
            effects: [
              { t: "take", id: "mushroom", n: 1 },
              { t: "flag", k: "q_sable" },
              { t: "coin", n: 40 },
              { t: "lore", id: "poem" },
              { t: "toast", m: "Sable copies a poem into your journal." },
            ],
            say: "Listen: The mushrooms write in rings. The pines repeat them softly. If you are late, the lanterns keep your place. It's yours now too.",
          },
          close("I'll hold onto it."),
        ],
      };
    }
    return {
      name: "Sable Quill",
      text: s.flags.q_sable
        ? "The poem behaves better on your page than on mine."
        : "One inkcap, if the forest offers. The board can wait. It is very good at waiting.",
      choices: [close("I'll read the notices.")],
    };
  }
  if (id === "bram") {
    if (!met(s, "bram")) {
      return {
        name: "Bram Oak",
        text: "The lake isn't a test. It's a conversation. I'm Bram. Cast when you like. Reel when the glow feels welcome.",
        choices: [
          {
            id: "hi",
            label: "Any advice?",
            effects: [{ t: "flag", k: "met_bram" }],
            say: "Missing is just a longer sentence. If you catch something and find me a smooth stone, I'll weight your line so the sweet spot is wider.",
          },
        ],
      };
    }
    if (!s.flags.q_bram && fishTotal(s) >= 1 && qty(s, "stone") >= 1) {
      return {
        name: "Bram Oak",
        text: "You've spoken with the lake already. A smooth stone would make a kinder weight.",
        choices: [
          {
            id: "give",
            label: "Give a smooth stone",
            effects: [
              { t: "take", id: "stone", n: 1 },
              { t: "flag", k: "q_bram" },
              { t: "rod" },
              { t: "toast", m: "Your line feels steadier." },
            ],
            say: "There. The glow will linger a little longer. Still no prize for rushing. The ducks would disapprove.",
          },
          close("Another time."),
        ],
      };
    }
    return {
      name: "Bram Oak",
      text: s.flags.q_bram
        ? "The dock likes your footsteps. Fish when the light is pretty."
        : "A smooth stone from the shore, after you've caught anything at all. I'll be on the dock. I live here, more or less.",
      choices: [close("Good luck to the fish.")],
    };
  }
  return { name: "Someone", text: "The breeze says hello.", choices: [close()] };
}

export function notices(day: number): string {
  const lines = [
    "Seed swap on the meadow edge, whenever you happen by. Bring a story or a bulb.",
    "Hana is simmering soup. Fish are welcome. Silence is also welcome.",
    "If the north pines seem to blink, that is a lantern remembering its job.",
    "Stargazing by the dock after dusk. No speeches. Blankets optional.",
  ];
  return lines[Math.abs(day) % lines.length] ?? lines[0]!;
}

export function questsOf(s: SaveData): QuestView[] {
  const regions = new Set(s.regions);
  const list: QuestView[] = [
    {
      id: "letter",
      title: "The letter on the step",
      desc: "Grandma Rowan left you the cottage. Speak with Elder Lior by the fountain when you feel ready.",
      done: !!s.flags.met_lior,
    },
    {
      id: "garden",
      title: "Wake the garden beds",
      desc: "Plant a seed, water it, then rest in your bed or let the day turn. Morning does the growing. Nothing withers if you forget.",
      done: s.harvests >= 1,
    },
    {
      id: "winds",
      title: "Walk the village slowly",
      desc: "Visit the garden, the square, the forest, the lake, and the meadow. The map fills in as you go.",
      done: ["Cottage Garden", "Little Lantern Village", "Pinewhisper Forest", "Lantern Lake", "Buttercup Meadow"].every((r) =>
        regions.has(r),
      ),
    },
    {
      id: "book",
      title: "A living collection",
      desc: "Find eight different gifts of the valley — flowers, fish, shells, stories. The book keeps them.",
      done: s.discovered.length >= 8,
    },
  ];
  if (s.flags.met_lior) {
    list.push({
      id: "mill",
      title: "The lantern in the pines",
      desc: "Look for a mushroom ring in the northern clearing. If you find an old lantern, Lior would like to see it.",
      done: !!s.flags.q_lior,
    });
  }
  if (s.flags.met_mira) {
    list.push({
      id: "daisies",
      title: "Three daisies for the path",
      desc: "Mira would like three daisies for the fountain. Pick them, grow them, either is kind.",
      done: !!s.flags.q_mira,
    });
  }
  if (s.flags.met_tomas) {
    list.push({
      id: "fence",
      title: "A fence that wants to stand",
      desc: "Bring six kindling to the broken fence beside your garden path.",
      done: !!s.flags.fence,
    });
    list.push({
      id: "chair",
      title: "Wood with a good memory",
      desc: "If you bring Tomas eight kindling, he will make you a chair.",
      done: !!s.flags.q_tomas,
    });
  }
  if (s.flags.met_hana) {
    list.push({
      id: "soup",
      title: "Two fish for the pot",
      desc: "Catch a pair of anything and share them with Hana. The cafe counter also buys and sells.",
      done: !!s.flags.q_hana,
    });
  }
  if (s.flags.met_sable) {
    list.push({
      id: "ink",
      title: "Ink for Sable",
      desc: "An inkcap from the forest shade would help the noticeboard poet.",
      done: !!s.flags.q_sable,
    });
  }
  if (s.flags.met_bram) {
    list.push({
      id: "weight",
      title: "A kinder fishing weight",
      desc: "Catch any fish, then bring Bram a smooth stone on the dock.",
      done: !!s.flags.q_bram,
    });
  }
  list.push({
    id: "hearth",
    title: "Make the room yours",
    desc: "Place three new pieces of furniture in the cottage. Tomas sells them. Gifts count.",
    done: !!s.flags.hearth,
  });
  list.push({
    id: "expand",
    title: "More room to grow",
    desc: "After four harvests, four extra beds open in your yard.",
    done: s.harvests >= 4,
  });
  return list;
}

export function takeFish(s: SaveData, n: number): boolean {
  let left = n;
  for (const f of FISH) {
    const have = s.items[f.id] ?? 0;
    if (!have) continue;
    const use = Math.min(have, left);
    s.items[f.id] = have - use;
    if (s.items[f.id] === 0) delete s.items[f.id];
    left -= use;
    if (left <= 0) return true;
  }
  return left <= 0;
}

export function pickFish(better: boolean): string {
  const pool = FISH.map((f) => ({ ...f, w: f.w + (better && f.w < 20 ? 8 : 0) }));
  const total = pool.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const f of pool) {
    r -= f.w;
    if (r <= 0) return f.id;
  }
  return "fish_minnow";
}
