# Testimony Charles: Solar System Portfolio

A portfolio you fly through in 3D. It opens with a rocket launch, planets are projects, the sun is me by day, the moon is me after hours, and each star around the big star is a job from my resume.

**Built with:** React (the page), Tailwind CSS (the styling), Three.js (the 3D scene), Vite (the build tool) and Vercel (publishing).

## Run it on your computer

You need [Node.js](https://nodejs.org). Then, from this folder:

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints. Saved changes appear in the browser straight away. Opening `index.html` directly will not work, because Vite has to build the page first.

## Where to change things

| I want to change... | Open |
|---|---|
| **Any text:** name, school, projects, jobs, interests, contact | `src/data/site.js` |
| How a planet looks | `surface` in `src/data/site.js`, recipes in `src/engine/shaders/surfaces.js` |
| The header and nav | `src/components/Header.jsx` |
| The text layout of one stop | `src/components/stops/` |
| Colours and fonts | the `@theme` block in `src/index.css` |
| How far the solar system tilts | `SYSTEM_TILT` in `src/engine/config.js` |
| Where the camera goes at each stop | `src/engine/cameraPath.js` |
| The rocket and launch | `src/engine/launch/createLaunch.js` |

## How the code fits together

```
src/
  main.jsx               starts the app
  App.jsx                the whole page, one component per part
  index.css              Tailwind setup and the few custom styles
  data/
    site.js              ALL of the content
  hooks/
    useSolarEngine.js    connects React to the 3D engine
  components/            what you see on the page (React + Tailwind)
    Header.jsx           name and nav
    ModeSlider.jsx       the sun-to-moon slider
    StopRail.jsx         dots on the right edge
    BodyLabels.jsx       clickable labels on planets and stars
    SkipLaunchButton.jsx
    DayTrack.jsx         every stop on the sun side, in order
    NightTrack.jsx       every stop on the moon side
    stops/               one file per kind of stop, plus the shared Stop frame
  engine/                the 3D scene (Three.js, no React)
    createEngine.js      the main loop that runs every frame
    config.js            sizes, tilt, and turning site.js into 3D bodies
    cameraPath.js        where the camera goes
    scrollTracks.js      turns scrolling into a position along the stops
    bodyLabels.js        moves labels and works out what you clicked
    textureBaker.js      paints planet surfaces on the graphics card
    math.js              small helpers
    scene/
      createWorld.js     builds the sun, planets, moon and stars
      updateWorld.js     moves and lights them each frame
      materials.js       how their surfaces are drawn
    launch/
      createLaunch.js    the rocket, pad, steam and launch timeline
      launchTextures.js  paints the hull and concrete
    shaders/             small programs for the graphics card (GLSL)
```

**The one idea to know:** React draws the page once and updates it when something like the selected nav link changes. Things that change 60 times a second, like the planets and the labels following them, are handled by the engine directly, because going through React for those would be too slow. `useSolarEngine.js` is the bridge between the two.

**Three.js version:** this project stays on Three.js 0.128 on purpose. Newer versions changed how lighting and colour work, so upgrading would change how the scene looks.

**Tip:** add `?debug` to the address, then type `solar.state` in the browser console to see the engine's live values.

## Publish with Vercel

The code lives on GitHub and Vercel publishes it. Vercel detects the settings from `vercel.json`, so there is nothing else to configure.

1. Push this project to a GitHub repository.
2. At [vercel.com/new](https://vercel.com/new), sign in with GitHub and import the repository.
3. Press **Deploy**.

After that, every push to `main` updates the live site, and every other branch gets its own preview link, so you can try a change before it goes live.

To check the production build on your computer first:

```bash
npm run build
```

```bash
npm run preview
```

## Credits

Display font: Bartomes by Garismantra. Text font: Instrument Sans.
