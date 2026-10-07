# ⚡ AI Challenger

**Stress-test your strategy in seconds.** AI Challenger is a zero-friction, mobile-first web app for corporate strategy and innovation workshops. Participants **snap a photo of a sticky-note board** (or type an idea), and the app runs it through four strategic **Thinking Hats** using [Groq](https://groq.com)'s ultra-fast models. Each hat returns a **Challenge Card**:

| Field | What it is |
| --- | --- |
| 👁️ **Blind spot** | What the team is not seeing. |
| 💀 **Fatal hypothesis** | The unvalidated assumption that kills the idea if it's false. |
| ❓ **Uncomfortable questions** | Two questions that put the team on the spot. |
| 🪧 **Pivot signal** | The metric or evidence that would call for a change of direction. |

## 🎩 The 4 hats

| Hat | Focus | Color |
| --- | --- | --- |
| 🏴‍☠️ **The Cynic** | Risk, security, adoption, finances: why it will fail. | `#f43f5e` |
| 🚀 **The Scaler** | Lack of scale; how to 10x it and break market barriers. | `#10b981` |
| 👿 **The Difficult Customer** | The laziest, cheapest, most demanding user. Why would they pay? | `#a855f7` |
| ⚙️ **The Realist Operator** | Technical complexity, dependencies, timelines and bottlenecks. | `#06b6d4` |

In text mode the selected hats run **in parallel**, so total time ≈ the slowest hat (usually < 2 s). In photo mode all hats are answered in **one request**, so the image's tokens are only paid once (important on Groq's free tier).

## 🧱 Stack

- **Next.js 15** (App Router, strict TypeScript)
- **Tailwind CSS**, **Framer Motion**, **Lucide React**
- **groq-sdk**, used on the server only
- Vision: `qwen/qwen3.8-27b` · Text: `llama-3.3-70b-versatile`

> **About models:** Groq retires models over time. The app has an automatic **fallback chain** (`src/lib/groq.ts`): if a model is decommissioned, blocked for your project, or fails, the next one is tried (text: `openai/gpt-oss-120b`, `gpt-oss-20b`, `qwen/qwen3.8-27b`…; vision: `qwen/qwen3.6-27b`…). You can force specific models with `GROQ_TEXT_MODEL` / `GROQ_VISION_MODEL`.

## 🔐 API key security

- `GROQ_API_KEY` **never** uses the `NEXT_PUBLIC_` prefix, so it never reaches the browser.
- Every Groq call goes through the serverless route `src/app/api/challenge/route.ts`. `src/lib/groq.ts` imports `server-only`, so the build fails if anything imports it from the client.
- `.env.local` and all `.env*` files are in `.gitignore`.
- If the key is missing, the API returns **HTTP 401** (`MISSING_API_KEY`) and the UI shows a modal with setup steps. If Groq rejects the key, it returns 401 `INVALID_API_KEY`.
- `GET /api/challenge` only reports `{"configured": true|false}` (used by the connection indicator) and never exposes the key.
- The server validates the payload: image type, size, text length and valid hats.

## 🔑 1. Get a free Groq API key

1. Go to **[console.groq.com](https://console.groq.com)** and sign in.
2. Open **API Keys** → **[Create API Key](https://console.groq.com/keys)**.
3. Name it (e.g. `ai-challenger`) and copy the key (`gsk_…`). It is shown only once.

## 💻 2. Local development

Requirements: **Node.js 18.18+** (20 or 22 recommended).

```bash
git clone https://github.com/felipemachado25/ai-challenger.git
cd ai-challenger
npm install
cp .env.example .env.local      # then paste your key into GROQ_API_KEY
npm run dev
```

Open <http://localhost:3000>. To try it from your phone on the same Wi-Fi network: `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-IP>:3000`. Some browsers only allow direct camera capture over HTTPS; on Vercel it always works.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (0 warnings allowed) |
| `npm run typecheck` | `tsc --noEmit` |

## 🚀 3. Deploy to Vercel (from GitHub)

1. Go to **[vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
2. Under **Import Git Repository**, pick `ai-challenger` → **Import**. Vercel detects Next.js automatically; leave the commands as they are.
3. Expand **Environment Variables** and add:
   - **Key:** `GROQ_API_KEY`
   - **Value:** your `gsk_…` key
   - Environments: Production, Preview and Development
4. Click **Deploy**. In about a minute you'll have a URL like `https://ai-challenger-xxxx.vercel.app`.
5. From then on, **every `git push` to `main` redeploys production**, and every branch or PR gets a preview URL.

> Deployed before adding the key? Add it under **Project → Settings → Environment Variables**, then **Deployments → ⋯ → Redeploy**. Variables only apply to new deployments.

## 🗂️ Structure

```
src/
├── app/
│   ├── api/challenge/route.ts   # Secure serverless route (Groq)
│   ├── layout.tsx               # Global dark theme & metadata
│   └── page.tsx                 # Workshop dashboard
├── components/
│   ├── Header.tsx               # Branding & connection status
│   ├── InputSection.tsx         # Camera / drag-and-drop / text
│   ├── LensSelector.tsx         # Hat selector
│   ├── ChallengeCards.tsx       # Animated cards + copy / analyze again
│   ├── ApiKeyWarning.tsx        # Modal when the API key is missing or invalid
│   └── Loader.tsx               # Processing indicator
├── lib/
│   ├── groq.ts                  # Groq client, prompts, model fallback (server-only)
│   ├── hats.ts                  # Hat visual metadata
│   ├── image.ts                 # In-browser image compression
│   ├── types.ts                 # Shared types and validators
│   └── utils.ts                 # cn() (clsx + tailwind-merge)
└── styles/globals.css           # Tailwind & base styles
```

## 🔌 API

`POST /api/challenge`

```jsonc
// Text
{ "mode": "text", "hats": ["cynic", "client"], "text": "Your idea…" }
// Image (Base64 data URL, compressed client-side to ≤1280px JPEG)
{ "mode": "image", "hats": ["operator"], "image": "data:image/jpeg;base64,…", "text": "optional context" }
```

`200` response:

```json
{
  "results": [
    {
      "hatId": "cynic",
      "ok": true,
      "model": "llama-3.3-70b-versatile",
      "latencyMs": 812,
      "challenge": {
        "blindspot": "…",
        "fatalHypothesis": "…",
        "uncomfortableQuestions": ["…?", "…?"],
        "pivotSignal": "…"
      }
    }
  ],
  "totalLatencyMs": 845
}
```

Errors: `400 BAD_REQUEST`, `401 MISSING_API_KEY | INVALID_API_KEY`, `413 PAYLOAD_TOO_LARGE`, `429 RATE_LIMITED`, `502 UPSTREAM_ERROR`, `500 INTERNAL_ERROR`, all shaped as `{ "error": { "code", "message" } }`.

## 🛠️ Troubleshooting

- **"API key missing" on Vercel:** add the variable and **Redeploy**.
- **"Groq error …" on a card:** the card shows Groq's exact message. Check **Vercel → Project → Logs** for `[groq]` lines showing which models were tried. If models are blocked, enable them at [console.groq.com/settings/limits](https://console.groq.com/settings/limits) or set `GROQ_TEXT_MODEL` / `GROQ_VISION_MODEL`.
- **"Groq's rate limit … was reached":** the free tier allows ~7,000 input tokens per minute per model. A photo costs ~1,500 tokens. Wait the seconds shown, select fewer hats, or upgrade at [console.groq.com/settings/billing](https://console.groq.com/settings/billing).
- **HEIC photos (iPhone):** Safari converts them automatically; if another browser fails, use JPG/PNG.
