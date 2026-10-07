# ⚡ AI Challenger

**Desafía tu estrategia en segundos.** AI Challenger es una web app *mobile-first* sin fricción para talleres de estrategia e innovación corporativa. Los participantes **fotografían un tablero de post-its** (o escriben una idea) y la app la pasa por cuatro **Sombreros de Pensamiento** usando los modelos ultrarrápidos de [Groq](https://groq.com). Cada sombrero devuelve una **Tarjeta de Desafío**:

| Campo | Qué es |
| --- | --- |
| 👁️ **Punto ciego** | Lo que el equipo no está viendo. |
| 💀 **Hipótesis fatal** | La suposición no validada que, si es falsa, mata la idea. |
| ❓ **Preguntas incómodas** | Dos preguntas para incomodar al equipo. |
| 🪧 **Señal de pivote** | La métrica o evidencia que indicaría cambiar de rumbo. |

## 🎩 Los 4 sombreros

| Sombrero | Foco | Color |
| --- | --- | --- |
| 🏴‍☠️ **El Cínico** | Riesgo, seguridad, adopción, finanzas: por qué fracasará. | `#f43f5e` |
| 🚀 **El Escalador** | Falta de escala; cómo multiplicar ×10 y romper barreras. | `#10b981` |
| 👿 **El Cliente Incómodo** | El usuario más perezoso, tacaño y exigente. ¿Por qué pagaría? | `#a855f7` |
| ⚙️ **El Operador Realista** | Complejidad técnica, dependencias, plazos y cuellos de botella. | `#06b6d4` |

Los sombreros seleccionados se ejecutan **en paralelo**, así que el tiempo total ≈ el del sombrero más lento (normalmente < 2 s).

## 🧱 Stack

- **Next.js 15** (App Router, TypeScript estricto)
- **Tailwind CSS**, **Framer Motion**, **Lucide React**
- **groq-sdk**: solo se usa en el servidor
- Visión: `meta-llama/llama-4-scout-17b-16e-instruct` · Texto: `llama-3.3-70b-versatile`

> **Sobre los modelos:** Groq retiró `llama-3.2-11b/90b-vision-preview` y `mixtral-8x7b-32768`. La app tiene una **cadena de fallback** (`src/lib/groq.ts`): si un modelo está deprecado, pasa solo al siguiente. Puedes forzar otros modelos con `GROQ_TEXT_MODEL` / `GROQ_VISION_MODEL`.

## 🔐 Seguridad de la API Key

- `GROQ_API_KEY` **nunca** lleva el prefijo `NEXT_PUBLIC_`, así que no llega al navegador.
- Toda llamada a Groq pasa por la ruta serverless `src/app/api/challenge/route.ts`. `src/lib/groq.ts` importa `server-only`, así que el build falla si alguien lo importa desde el cliente.
- `.env.local` y el resto de archivos `.env*` están en `.gitignore`.
- Si falta la clave, la API responde **HTTP 401** (`MISSING_API_KEY`) y la interfaz muestra un modal con los pasos para configurarla. Si Groq rechaza la clave, responde 401 `INVALID_API_KEY`.
- `GET /api/challenge` solo indica `{"configured": true|false}` (lo usa el indicador de conexión), sin exponer la clave.
- El servidor valida el payload: tipo de imagen, tamaño, longitud del texto y sombreros válidos.

## 🔑 1. Obtener una API Key gratuita de Groq

1. Entra en **[console.groq.com](https://console.groq.com)** e inicia sesión (Google/GitHub/email).
2. Ve a **API Keys** → **[Create API Key](https://console.groq.com/keys)**.
3. Ponle un nombre (p. ej. `ai-challenger`) y copia la clave (`gsk_…`). Solo se muestra una vez.

## 💻 2. Desarrollo local

Requisitos: **Node.js 18.18+** (recomendado 20 o 22).

```bash
git clone https://github.com/felipemachado25/ai-challenger.git
cd ai-challenger
npm install
cp .env.example .env.local      # y pega tu clave en GROQ_API_KEY
npm run dev
```

Abre <http://localhost:3000>. Para probarlo desde el móvil en la misma red Wi-Fi: `npm run dev -- -H 0.0.0.0` y abre `http://<IP-de-tu-PC>:3000`. Nota: la cámara directa requiere HTTPS en algunos navegadores; en producción (Vercel) funciona siempre.

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint (0 warnings permitidos) |
| `npm run typecheck` | `tsc --noEmit` |

## 🚀 3. Deploy en Vercel (desde GitHub)

1. Sube el repositorio a GitHub (ya está en `felipemachado25/ai-challenger`).
2. Entra en **[vercel.com/new](https://vercel.com/new)** e inicia sesión con GitHub.
3. En **Import Git Repository**, elige `ai-challenger` → **Import**. Vercel detecta Next.js solo; no cambies los comandos.
4. Despliega **Environment Variables** y añade:
   - **Key:** `GROQ_API_KEY`
   - **Value:** tu clave `gsk_…`
   - Entornos: Production, Preview y Development
5. Pulsa **Deploy**. En ~1 minuto tendrás una URL `https://ai-challenger-xxxx.vercel.app`.
6. A partir de ahí, **cada `git push` a `main` redespliega producción** y cada rama o PR genera una URL de preview.

> ¿Ya desplegaste sin la clave? Añádela en **Project → Settings → Environment Variables** y luego **Deployments → ⋯ → Redeploy**. Las variables solo se aplican en despliegues nuevos.

### Botón de deploy en un clic

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffelipemachado25%2Fai-challenger&env=GROQ_API_KEY&envDescription=API%20Key%20gratuita%20de%20console.groq.com&envLink=https%3A%2F%2Fconsole.groq.com%2Fkeys)

## 🗂️ Estructura

```
src/
├── app/
│   ├── api/challenge/route.ts   # Ruta serverless segura (Groq)
│   ├── layout.tsx               # Tema oscuro global y metadata
│   └── page.tsx                 # Dashboard del taller
├── components/
│   ├── Header.tsx               # Branding y estado de conexión
│   ├── InputSection.tsx         # Cámara / drag-and-drop / texto
│   ├── LensSelector.tsx         # Selector de sombreros
│   ├── ChallengeCards.tsx       # Tarjetas animadas + copiar / re-analizar
│   ├── ApiKeyWarning.tsx        # Modal si falta o falla la API Key
│   └── Loader.tsx               # Indicador de procesamiento
├── lib/
│   ├── groq.ts                  # Cliente Groq, prompts, fallback de modelos (server-only)
│   ├── hats.ts                  # Metadatos visuales de los sombreros
│   ├── image.ts                 # Compresión de imágenes en el navegador
│   ├── types.ts                 # Tipos y validadores compartidos
│   └── utils.ts                 # cn() (clsx + tailwind-merge)
└── styles/globals.css           # Tailwind y estilos base
```

## 🔌 API

`POST /api/challenge`

```jsonc
// Texto
{ "mode": "text", "hats": ["cynic", "client"], "text": "Tu idea…" }
// Imagen (data URL Base64, comprimida en el cliente a ≤1600px JPEG)
{ "mode": "image", "hats": ["operator"], "image": "data:image/jpeg;base64,…", "text": "contexto opcional" }
```

Respuesta `200`:

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

Errores: `400 BAD_REQUEST`, `401 MISSING_API_KEY | INVALID_API_KEY`, `413 PAYLOAD_TOO_LARGE`, `429 RATE_LIMITED`, `502 UPSTREAM_ERROR`, `500 INTERNAL_ERROR`, todos con el formato `{ "error": { "code", "message" } }`.

## 🛠️ Solución de problemas

- **"Falta API Key" en Vercel:** añade la variable y haz **Redeploy**.
- **Error de modelo / 502:** Groq pudo haber retirado un modelo. Revisa [console.groq.com/docs/models](https://console.groq.com/docs/models) y define `GROQ_TEXT_MODEL` / `GROQ_VISION_MODEL`.
- **Fotos HEIC (iPhone):** Safari las convierte solas; si otro navegador falla, usa JPG/PNG.
