# Game-style Portfolio (Next.js)

Side-scrolling retro game jaisa portfolio. Player chalta/kudta hai, aur green pipe ke upar khade hoke **Down** dabane par us section ki details khulti hain.

## Chalane ke liye

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Resume kaise bharna hai

Sirf `data/resume.ts` edit karo. Har `section` ek pipe banata hai, aur order wahi rahta hai jo file mein hai. Naya section add karna ho to ek aur object push kar do — pipe, level ki lambai aur HUD counter apne aap adjust ho jayenge.

## Controls

| Action     | Keyboard        | Phone          |
| ---------- | --------------- | -------------- |
| Chalna     | Arrow keys / AD | on-screen ◀ ▶  |
| Kudna      | Space / W / Up  | on-screen ▲    |
| Pipe mein  | Down / S        | on-screen ▼    |
| Band karna | Esc / bahar tap | bahar tap / X  |

## Structure

- `data/resume.ts` — saara content
- `components/Game.tsx` — canvas game (physics, camera, pixel art)
- `components/Modal.tsx` — section popup
- `app/globals.css` — styling
