# Game-Style Portfolio (Next.js)

An interactive, retro side-scrolling portfolio. Walk and jump through the level, then stand on a green pipe and press **Down** to dive in and read that section of the resume.

All graphics are drawn in code on an HTML canvas (no image files), and sound effects are generated with the Web Audio API (no audio files).

🔴 LIVE DEMO: https://parthava-borah-ten.vercel.app/

## Getting Started

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Editing the Content

All resume content lives in a single file: **`data/resume.ts`**.

- `profile`: name, role, start-screen tagline and resume PDF link
- `sections`: each section becomes one green pipe, in the same order as the file

To add a section, push another object into `sections`. The pipe, level length and HUD counter adjust automatically.

To update the downloadable resume, replace `public/resume.pdf`.

## Controls

| Action        | Keyboard          | Mobile             |
| ------------- | ----------------- | ------------------ |
| Move          | Arrow keys / A, D | On-screen ◀ ▶      |
| Jump          | Space / W / Up    | On-screen ▲        |
| Enter pipe    | Down / S          | On-screen ▼        |
| Close popup   | Esc / click outside | Tap outside / X  |

## Gameplay

- Collect coins: +100 points each
- Jump into a gem block from below to pop a coin
- Enter a pipe for the first time: +1000 points
- Visit every pipe to clear the level

## Project Structure

```
app/
  layout.tsx        Root layout and fonts
  page.tsx          Renders the game
  globals.css       Styling (HUD, popup, touch controls)
components/
  Game.tsx          Canvas game: physics, camera, pixel art, sound
  Modal.tsx         Section popup
data/
  resume.ts         All resume content
public/
  resume.pdf        Downloadable resume
```

## Notes

- The pixel fonts (Press Start 2P and VT323) load from Google Fonts, so the first load needs an internet connection. Without it, a default monospace font is used.
- All art is original and not taken from any existing game.

## Deployment

The easiest option is [Vercel](https://vercel.com): push the project to GitHub, import it, and deploy. Any host that supports Next.js will also work.
