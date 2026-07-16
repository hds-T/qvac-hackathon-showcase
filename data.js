/* ===========================================================================
   QVAC Hackathon - showcase data (JSON-driven)
   ---------------------------------------------------------------------------
   The real submissions live in ./projects.json (a raw, UNMODIFIED export).
   This file holds only the static config (tracks, vote banner, category order)
   plus a small runtime adapter that maps each JSON record to the internal
   shape the page renders.

   To update the showcase: replace projects.json with the new export and
   reload. Nothing else changes. Do NOT hand-edit records here.

   projects.json record shape (from the export):
     { project_name, team_name, description, image_prompt, track,
       github, demo_video, live_demo, category }

   Internal project shape (what core.js and the page consume):
     { id, name, team, company, track(id), category, description,
       links:{github,video,demo}, image, image_prompt }
   =========================================================================== */

window.HACKATHON = {
  meta: {
    title: "QVAC Hackathon",
    edition: "I - Unleash Edge AI",
    voteOpen: false,
    voteUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfZEmfyO7PniazH4uxhiYKv-nGCWefLR6wXQea0fhZ56B3UaQ/viewform",
    voteDeadline: "July 12, 2026, 23:59 UTC",

    // Category order for the sub-filter. Categories present in the data render
    // in this order; anything new falls in at the end automatically.
    categories: [
      "Healthcare", "Emergency", "Legal", "Privacy/Security", "Web3",
      "Finance", "Productivity", "Education", "Creative", "DevTools",
      "Accessibility", "Entertainment", "Edge AI", "Other",
    ],
  },

  // Tracks. Colours map to QVAC's sanctioned categorical palette (acqua primary
  // + the three data-viz peers), so each track is distinct but on-brand.
  tracks: [
    { id:"general",  name:"General Purpose", short:"General",  color:"#16E3C1", blurb:"Anything that runs local AI on any device." },
    { id:"mobile",   name:"Mobile",          short:"Mobile",   color:"#6878B4", blurb:"On-device AI on iOS and Android, including LoRA on phone." },
    { id:"psy",      name:"Psy Models",      short:"Psy",      color:"#B44D75", blurb:"Built on the QVAC Psy model family: health, triage and clinical work." },
    { id:"tinkerer", name:"Tinkerer",        short:"Tinkerer", color:"#C48A2E", blurb:"Hardware hacks, robots, off-grid and weird builds." },
  ],

  projects: [],   // filled from projects.json by the adapter below
};

/* ---- runtime adapter: projects.json record -> internal project shape ---- */
(function () {
  const H = window.HACKATHON;

  // JSON track label (full name) -> internal track id
  const TRACK_ID = {
    "general purpose": "general",
    "mobile":          "mobile",
    "psy models":      "psy",
    "psy":             "psy",
    "tinkerer":        "tinkerer",
  };
  const trackIds = new Set(H.tracks.map(t => t.id));

  function slug(s) {
    return String(s || "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
  }

  function adapt(raw) {
    const seen = {};
    return (raw || []).map((r, i) => {
      let id = slug(r.project_name);
      if (seen[id]) id = id + "-" + i;     // guarantee unique ids (e.g. two "stash")
      seen[id] = 1;

      let track = TRACK_ID[String(r.track || "").toLowerCase().trim()];
      if (!trackIds.has(track)) track = "general";

      const links = {};
      if (r.github)     links.github = r.github;
      if (r.demo_video) links.video  = r.demo_video;
      if (r.live_demo)  links.demo   = r.live_demo;

      return {
        id,
        name: r.project_name || "Untitled",
        team: r.team_name || null,
        company: null,
        track,
        category: r.category || "Other",
        description: r.description || "",
        links,
        hasDemo: !!r.demo_video,               // demo_video -> "Video" pill + "has demo video" filter
        hasLiveDemo: !!r.live_demo,            // live_demo -> "Demo" pill
        socialVote: Number(r.social_vote) || 0,// community "thumbs up" count -> thumbs-up icons by the title
        image: "./covers/" + id + ".jpg",     // AI cover; falls back to procedural on 404 (see coverHTML)
        image_prompt: r.image_prompt || null, // the generation prompt, kept for re-rolls
      };
    });
  }

  // Expose a promise the page awaits before its first render.
  window.HACKATHON_READY = fetch("./projects.json", { cache: "no-store" })
    .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(list => { H.projects = adapt(list); return H.projects; })
    .catch(err => {
      console.error("[hackathon] could not load projects.json:", err);
      H.projects = [];
      return [];
    });
})();
