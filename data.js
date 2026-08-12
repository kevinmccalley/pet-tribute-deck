// Pet Tribute Deck — content bank + quiz.
//
// Voice: every line is written as if spoken BY the pet, in first person,
// addressed to the owner ("I follow you from room to room"). This is the
// dominant convention in pet-tribute content (Rainbow Bridge poems are the
// clearest example) and — critically — it reads naturally in both
// Celebration and Memorial mode without a tense fork, so one bank serves
// both moments instead of needing two. See docs/plan for the full reasoning
// (approved by Kevin 2026-08-12).
//
// 6 categories (vs. the human decks' 10) — a pet's role in a life clusters
// narrower than a person's internal arc, so 6 real axes beat inventing
// distinctions to hit 10. ~25 lines each, ~150 total (about half the human
// decks' 300), matching the roadmap's explicit "shorter bank" call.

const AFFIRMATIONS_DATA = {
  categories: [
    { "id": "companionship", "label": "Companionship & Presence" },
    { "id": "playfulness", "label": "Playfulness & Joy" },
    { "id": "comfort_loyalty", "label": "Comfort & Loyalty" },
    { "id": "quirks_personality", "label": "Quirks & Personality" },
    { "id": "everyday_moments", "label": "Everyday Moments" },
    { "id": "unconditional_love", "label": "Unconditional Love" }
  ],

  affirmations: [
    { "id": "CP01", "category": "companionship", "text": "I follow you from room to room, just to be near you." },
    { "id": "CP02", "category": "companionship", "text": "I wait by the door for you, every single time." },
    { "id": "CP03", "category": "companionship", "text": "Wherever you are, that's where I want to be." },
    { "id": "CP04", "category": "companionship", "text": "I don't need a reason to sit next to you — I just do." },
    { "id": "CP05", "category": "companionship", "text": "I'm the first one to notice when you're home." },
    { "id": "CP06", "category": "companionship", "text": "I keep watch while you sleep." },
    { "id": "CP07", "category": "companionship", "text": "I show up at your feet the second you sit down." },
    { "id": "CP08", "category": "companionship", "text": "I follow the sound of your voice across the whole house." },
    { "id": "CP09", "category": "companionship", "text": "I don't mind the quiet — I just want to be in the room with you." },
    { "id": "CP10", "category": "companionship", "text": "I'm always somewhere you can see me, even when I'm resting." },
    { "id": "CP11", "category": "companionship", "text": "I choose the spot closest to you, every time, without thinking about it." },
    { "id": "CP12", "category": "companionship", "text": "I've never once needed you to entertain me — just to be there." },
    { "id": "CP13", "category": "companionship", "text": "I'm the one who notices you leave before anyone else does." },
    { "id": "CP14", "category": "companionship", "text": "I wait at the window until I hear you coming." },
    { "id": "CP15", "category": "companionship", "text": "I keep you company on the days no one else does." },
    { "id": "CP16", "category": "companionship", "text": "I'm there in the morning, and I'm there when the lights go out." },
    { "id": "CP17", "category": "companionship", "text": "I don't need words to know when you want company." },
    { "id": "CP18", "category": "companionship", "text": "I follow you to the mailbox, the garage, the end of the driveway — anywhere." },
    { "id": "CP19", "category": "companionship", "text": "I'm the shadow you didn't ask for and never wanted to lose." },
    { "id": "CP20", "category": "companionship", "text": "I take up the space right next to you, every chance I get." },
    { "id": "CP21", "category": "companionship", "text": "I've learned exactly where you'll be at exactly what time." },
    { "id": "CP22", "category": "companionship", "text": "I'm the reason you're never really alone in this house." },
    { "id": "CP23", "category": "companionship", "text": "I show up quietly and just stay." },
    { "id": "CP24", "category": "companionship", "text": "I've spent more hours next to you than almost anyone else ever has." },
    { "id": "CP25", "category": "companionship", "text": "I don't follow you because I have to — I follow you because I want to." },

    { "id": "PL01", "category": "playfulness", "text": "I turn an empty box into the best toy in the house." },
    { "id": "PL02", "category": "playfulness", "text": "I still get the zoomies over absolutely nothing." },
    { "id": "PL03", "category": "playfulness", "text": "I bring you the same toy a hundred times because it always works." },
    { "id": "PL04", "category": "playfulness", "text": "I've never met a puddle, pile of leaves, or open drawer I didn't investigate." },
    { "id": "PL05", "category": "playfulness", "text": "I make you laugh without even trying." },
    { "id": "PL06", "category": "playfulness", "text": "I turn one single word into the best part of your whole day." },
    { "id": "PL07", "category": "playfulness", "text": "I chase things that aren't even there, just for the fun of it." },
    { "id": "PL08", "category": "playfulness", "text": "I've perfected the art of the dramatic play-bow." },
    { "id": "PL09", "category": "playfulness", "text": "I get so excited I forget how to sit still." },
    { "id": "PL10", "category": "playfulness", "text": "I find joy in the most ordinary five minutes of your day." },
    { "id": "PL11", "category": "playfulness", "text": "I've never once played it cool about anything I love." },
    { "id": "PL12", "category": "playfulness", "text": "I turn a simple game into the highlight of my whole day." },
    { "id": "PL13", "category": "playfulness", "text": "I still pounce on my toys like it's the first time, every time." },
    { "id": "PL14", "category": "playfulness", "text": "I make ordinary errands and car rides into a whole personality." },
    { "id": "PL15", "category": "playfulness", "text": "I've got a happy dance and I'm not embarrassed about it." },
    { "id": "PL16", "category": "playfulness", "text": "I bring the same energy to a walk around the block as I would to an adventure." },
    { "id": "PL17", "category": "playfulness", "text": "I know exactly how to turn a bad day into a better one." },
    { "id": "PL18", "category": "playfulness", "text": "I've never taken a nap I didn't fully commit to." },
    { "id": "PL19", "category": "playfulness", "text": "I get genuinely thrilled by the little things — a new smell, a squeaky toy, you coming home." },
    { "id": "PL20", "category": "playfulness", "text": "I make ordinary days feel like something worth celebrating." },
    { "id": "PL21", "category": "playfulness", "text": "I've never pretended to be too cool to play." },
    { "id": "PL22", "category": "playfulness", "text": "I turn snack time into the best sentence you can say out loud." },
    { "id": "PL23", "category": "playfulness", "text": "I chase my own tail sometimes just because I can." },
    { "id": "PL24", "category": "playfulness", "text": "I bring a kind of joy to this house that nothing else does." },
    { "id": "PL25", "category": "playfulness", "text": "I don't need a reason to be happy — I just am, and it's contagious." },

    { "id": "CL01", "category": "comfort_loyalty", "text": "I show up the second something feels wrong, even before you say anything." },
    { "id": "CL02", "category": "comfort_loyalty", "text": "I've never once judged you for crying." },
    { "id": "CL03", "category": "comfort_loyalty", "text": "I stay close on the hard days without needing to be asked." },
    { "id": "CL04", "category": "comfort_loyalty", "text": "I don't care what kind of day you've had — I'm still glad to see you." },
    { "id": "CL05", "category": "comfort_loyalty", "text": "I've sat through every version of you, good days and bad ones." },
    { "id": "CL06", "category": "comfort_loyalty", "text": "I lean into you when you need it most, no explanation required." },
    { "id": "CL07", "category": "comfort_loyalty", "text": "I'm the same toward you whether you're at your best or your worst." },
    { "id": "CL08", "category": "comfort_loyalty", "text": "I've never once left when things got difficult." },
    { "id": "CL09", "category": "comfort_loyalty", "text": "I show up steady, even when everything else feels uncertain." },
    { "id": "CL10", "category": "comfort_loyalty", "text": "I don't need you to be okay for me to stay close." },
    { "id": "CL11", "category": "comfort_loyalty", "text": "I've learned the sound of your voice when something's wrong, and I come running." },
    { "id": "CL12", "category": "comfort_loyalty", "text": "I'm the one constant on the days that don't go the way you planned." },
    { "id": "CL13", "category": "comfort_loyalty", "text": "I don't flinch at your bad moods — I just stay." },
    { "id": "CL14", "category": "comfort_loyalty", "text": "I've never needed a reason to comfort you. Your being upset was reason enough." },
    { "id": "CL15", "category": "comfort_loyalty", "text": "I sit with you in the silence when nobody else knows what to say." },
    { "id": "CL16", "category": "comfort_loyalty", "text": "I've been steady through every move, every change, every hard year." },
    { "id": "CL17", "category": "comfort_loyalty", "text": "I don't keep score of the good days versus the bad ones — I'm just here either way." },
    { "id": "CL18", "category": "comfort_loyalty", "text": "I show up for you the same way, every single day, without fail." },
    { "id": "CL19", "category": "comfort_loyalty", "text": "I've never once made you feel like a burden." },
    { "id": "CL20", "category": "comfort_loyalty", "text": "I stay close on the nights you can't sleep." },
    { "id": "CL21", "category": "comfort_loyalty", "text": "I don't need things to be perfect to be exactly where I want to be — with you." },
    { "id": "CL22", "category": "comfort_loyalty", "text": "I've watched you go through things I couldn't fix, and I stayed anyway." },
    { "id": "CL23", "category": "comfort_loyalty", "text": "I'm loyal in the quiet, unglamorous way — the way that actually counts." },
    { "id": "CL24", "category": "comfort_loyalty", "text": "I show up for the version of you nobody else sees." },
    { "id": "CL25", "category": "comfort_loyalty", "text": "I've never once made you earn my loyalty. You just had it." },

    { "id": "QP01", "category": "quirks_personality", "text": "I have exactly one weird habit that somehow makes total sense to you." },
    { "id": "QP02", "category": "quirks_personality", "text": "I've got opinions about things that don't even matter, and I stand by them." },
    { "id": "QP03", "category": "quirks_personality", "text": "I'm stubborn about the strangest, smallest things." },
    { "id": "QP04", "category": "quirks_personality", "text": "I've got a signature move nobody taught me and everybody recognizes." },
    { "id": "QP05", "category": "quirks_personality", "text": "I'm suspicious of one specific object and nothing will change my mind about it." },
    { "id": "QP06", "category": "quirks_personality", "text": "I've never met a routine I wasn't fiercely attached to." },
    { "id": "QP07", "category": "quirks_personality", "text": "I have a very specific opinion about where I'm allowed to sleep." },
    { "id": "QP08", "category": "quirks_personality", "text": "I'm dramatic about things that don't call for drama, and I don't apologize for it." },
    { "id": "QP09", "category": "quirks_personality", "text": "I've got a personality too big for however small I actually am." },
    { "id": "QP10", "category": "quirks_personality", "text": "I do this one thing that makes no logical sense and somehow it's just so me." },
    { "id": "QP11", "category": "quirks_personality", "text": "I've never once been subtle about what I want." },
    { "id": "QP12", "category": "quirks_personality", "text": "I'm particular in ways nobody else would even notice but you always do." },
    { "id": "QP13", "category": "quirks_personality", "text": "I've got a whole range of sounds that mean very specific things, and you know all of them." },
    { "id": "QP14", "category": "quirks_personality", "text": "I'm not like any other pet you've ever had, and you wouldn't want me to be." },
    { "id": "QP15", "category": "quirks_personality", "text": "I've got quirks that would drive anyone else a little crazy, and you love every one of them." },
    { "id": "QP16", "category": "quirks_personality", "text": "I'm weirdly afraid of things that shouldn't be scary and completely fearless about things that should be." },
    { "id": "QP17", "category": "quirks_personality", "text": "I've never grown out of the habit that makes you laugh every single time." },
    { "id": "QP18", "category": "quirks_personality", "text": "I'm the only one who does that exact thing, and everyone who meets me notices." },
    { "id": "QP19", "category": "quirks_personality", "text": "I've got a very specific way of asking for what I want, and it always works." },
    { "id": "QP20", "category": "quirks_personality", "text": "I'm particular about my food, my spot, my routine — and you've learned every rule." },
    { "id": "QP21", "category": "quirks_personality", "text": "I've never once been like anyone else's pet, and that's exactly the point." },
    { "id": "QP22", "category": "quirks_personality", "text": "I'm a whole character, not just an animal in the house." },
    { "id": "QP23", "category": "quirks_personality", "text": "I've got a personality so specific you could pick me out of a hundred others." },
    { "id": "QP24", "category": "quirks_personality", "text": "I'm exactly as strange as I need to be to be completely, unmistakably me." },
    { "id": "QP25", "category": "quirks_personality", "text": "I've never had to try to stand out. I just am who I am." },

    { "id": "EM01", "category": "everyday_moments", "text": "I've got a spot on the couch that's technically yours and practically mine." },
    { "id": "EM02", "category": "everyday_moments", "text": "I know the sound of the treat bag from two rooms away." },
    { "id": "EM03", "category": "everyday_moments", "text": "I've turned getting the mail into a two-person job." },
    { "id": "EM04", "category": "everyday_moments", "text": "I'm the reason your morning routine takes five extra minutes." },
    { "id": "EM05", "category": "everyday_moments", "text": "I've learned exactly what time you usually get up, and I'm ready before you are." },
    { "id": "EM06", "category": "everyday_moments", "text": "I wait by the food bowl at the same time every single day, like clockwork." },
    { "id": "EM07", "category": "everyday_moments", "text": "I've made myself part of your daily routine, whether you planned on that or not." },
    { "id": "EM08", "category": "everyday_moments", "text": "I know your schedule better than you think I do." },
    { "id": "EM09", "category": "everyday_moments", "text": "I'm there for the small, unremarkable parts of your day nobody else sees." },
    { "id": "EM10", "category": "everyday_moments", "text": "I've turned an ordinary evening on the couch into the best part of my whole day." },
    { "id": "EM11", "category": "everyday_moments", "text": "I know exactly which chair is mine, and which one I've decided is also mine." },
    { "id": "EM12", "category": "everyday_moments", "text": "I've made peace with the vacuum, mostly, on most days." },
    { "id": "EM13", "category": "everyday_moments", "text": "I'm part of the little rituals that make an ordinary day feel like yours." },
    { "id": "EM14", "category": "everyday_moments", "text": "I know the difference between getting ready for work and getting ready for a walk, and I react accordingly." },
    { "id": "EM15", "category": "everyday_moments", "text": "I've turned mealtime into an event I take very seriously." },
    { "id": "EM16", "category": "everyday_moments", "text": "I'm the reason you talk out loud to yourself more than you used to." },
    { "id": "EM17", "category": "everyday_moments", "text": "I know when it's almost time for bed before you even say it." },
    { "id": "EM18", "category": "everyday_moments", "text": "I've made myself at home in every single room, no exceptions." },
    { "id": "EM19", "category": "everyday_moments", "text": "I'm there for the boring parts of your day — the errands, the chores, the nothing-much afternoons." },
    { "id": "EM20", "category": "everyday_moments", "text": "I've learned every creak in this house and which ones mean you're home." },
    { "id": "EM21", "category": "everyday_moments", "text": "I know the sound of your keys and exactly what it means." },
    { "id": "EM22", "category": "everyday_moments", "text": "I'm part of the little things you'd miss before you'd even notice you missed them." },
    { "id": "EM23", "category": "everyday_moments", "text": "I've made an ordinary Tuesday into something worth remembering." },
    { "id": "EM24", "category": "everyday_moments", "text": "I know this house as well as you do, maybe better." },
    { "id": "EM25", "category": "everyday_moments", "text": "I'm woven into the small, everyday moments that actually make up a life." },

    { "id": "UL01", "category": "unconditional_love", "text": "I love you the same on your best day and your worst one." },
    { "id": "UL02", "category": "unconditional_love", "text": "I've never once needed you to be anything other than exactly who you are." },
    { "id": "UL03", "category": "unconditional_love", "text": "I don't love you for what you can do for me. I just love you." },
    { "id": "UL04", "category": "unconditional_love", "text": "I've loved you through every version of yourself you've been." },
    { "id": "UL05", "category": "unconditional_love", "text": "I don't keep track of what you owe me. There's no ledger. There never was." },
    { "id": "UL06", "category": "unconditional_love", "text": "I love you without any of the conditions people usually attach to it." },
    { "id": "UL07", "category": "unconditional_love", "text": "I've never needed a good reason. Being yours was always reason enough." },
    { "id": "UL08", "category": "unconditional_love", "text": "I love you in the way that doesn't ask anything back." },
    { "id": "UL09", "category": "unconditional_love", "text": "I've loved you the same whether you had a good year or a hard one." },
    { "id": "UL10", "category": "unconditional_love", "text": "I don't love you less on the days you have less to give." },
    { "id": "UL11", "category": "unconditional_love", "text": "I love you the way you needed to be loved, without you ever having to ask." },
    { "id": "UL12", "category": "unconditional_love", "text": "I've never once loved you conditionally, and I never will." },
    { "id": "UL13", "category": "unconditional_love", "text": "I love you in the simplest, most complete way there is." },
    { "id": "UL14", "category": "unconditional_love", "text": "I don't need you to earn this. You never had to." },
    { "id": "UL15", "category": "unconditional_love", "text": "I've loved you longer, and more simply, than almost anyone else in your life." },
    { "id": "UL16", "category": "unconditional_love", "text": "I love you exactly as you are, not as some better version of you." },
    { "id": "UL17", "category": "unconditional_love", "text": "I've never wavered, not once, not for a single day." },
    { "id": "UL18", "category": "unconditional_love", "text": "I love you the way every living thing deserves to be loved and rarely is." },
    { "id": "UL19", "category": "unconditional_love", "text": "I don't love you because of anything you did. I just always have." },
    { "id": "UL20", "category": "unconditional_love", "text": "I've loved you with everything I have, every single day I've had." },
    { "id": "UL21", "category": "unconditional_love", "text": "I love you in a way that isn't complicated, isn't conditional, and isn't going anywhere." },
    { "id": "UL22", "category": "unconditional_love", "text": "I've never needed you to be perfect. I loved you exactly as you were." },
    { "id": "UL23", "category": "unconditional_love", "text": "I love you the way that doesn't need translating — you always knew." },
    { "id": "UL24", "category": "unconditional_love", "text": "I've given you the one thing that never needed to be earned: my whole heart." },
    { "id": "UL25", "category": "unconditional_love", "text": "I love you, simply and completely, and I always will." }
  ]
};

// Mode branching (Celebration vs. Memorial) — same shape as wedding-party-cards'
// MOMENT_COPY object for Ask vs. Thank You. The content bank above is shared
// across both modes (tense-neutral pet-voice lines); only the cover-card
// framing and the bonus free-text card's placeholder copy change by mode.
const PET_MODE_COPY = {
  celebration: {
    id: "celebration",
    label: "Celebration",
    description: "For a pet who's still very much here.",
    coverEyebrow: "A TRIBUTE TO",
    coverTitle: "{name}",
    showYearsField: false,
    bonusFieldLabel: "Add your own message (optional)",
    bonusPlaceholder: "Anything else about {name} you want on a card?",
    questionVerb: "is",
    questionVerbCap: "Is",
  },
  memorial: {
    id: "memorial",
    label: "Memorial",
    description: "For a pet you're honoring the memory of.",
    coverEyebrow: "IN LOVING MEMORY OF",
    coverTitle: "{name}",
    showYearsField: true,
    bonusFieldLabel: "Share a memory (optional)",
    bonusPlaceholder: "Share a memory, or how you said goodbye.",
    questionVerb: "was",
    questionVerbCap: "Was",
  },
};

const DEFAULT_MODE = "celebration";

// Question text carries both a {name} token and a {verb} token — {verb}
// resolves to "is"/"was" depending on the buyer's chosen mode (see
// questionText() in app.js), the light tense fork the plan calls out as the
// one place mode actually touches the quiz itself.
const QUESTIONS = [
  {
    text: "What {verb} {name} like to be around?",
    options: [
      { label: "Always right there, wherever I am", weights: { companionship: 1 } },
      { label: "Steady and comforting, especially on hard days", weights: { comfort_loyalty: 1 } },
      { label: "Full of personality, never quite like any other pet", weights: { quirks_personality: 1 } },
      { label: "Playful, almost never able to sit still", weights: { playfulness: 1 } }
    ]
  },
  {
    text: "What {verb} {name} actually really good at?",
    options: [
      { label: "Knowing exactly when I needed them", weights: { comfort_loyalty: 1 } },
      { label: "Making me laugh without even trying", weights: { playfulness: 1 } },
      { label: "Being part of my everyday routine, like clockwork", weights: { everyday_moments: 1 } },
      { label: "Being unmistakably, specifically themselves", weights: { quirks_personality: 1 } }
    ]
  },
  {
    text: "What do you love most about {name}?",
    options: [
      { label: "The simple, unconditional way they loved me back", weights: { unconditional_love: 1 } },
      { label: "The little daily moments we shared", weights: { everyday_moments: 0.5, companionship: 0.5 } },
      { label: "How steady and loyal they always {verb}", weights: { comfort_loyalty: 0.5, unconditional_love: 0.5 } },
      { label: "Their specific, ridiculous personality", weights: { quirks_personality: 1 } }
    ]
  },
  {
    text: "If you had to sum up {name} in one word, what would it be?",
    options: [
      { label: "Devoted", weights: { companionship: 0.5, unconditional_love: 0.5 } },
      { label: "Goofy", weights: { playfulness: 1 } },
      { label: "Steady", weights: { comfort_loyalty: 1 } },
      { label: "One-of-a-kind", weights: { quirks_personality: 0.5, unconditional_love: 0.5 } }
    ]
  }
];
