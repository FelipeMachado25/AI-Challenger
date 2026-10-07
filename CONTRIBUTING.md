# Contributing to AI Challenger

Thanks for your interest in improving AI Challenger! 🎩

## Getting started

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/my-change
   ```
2. Install dependencies and set up your key:
   ```bash
   npm install
   cp .env.example .env.local   # add your GROQ_API_KEY
   npm run dev
   ```

## Before opening a pull request

Run the same checks CI runs. All three must pass with no warnings:

```bash
npm run lint
npm run typecheck
npm run build
```

## Guidelines

- **Keep the API key server-side.** Never import `src/lib/groq.ts` from a client component and never add `NEXT_PUBLIC_` to `GROQ_API_KEY`.
- **Match the existing style**: TypeScript strict, functional React components, Tailwind for styling, Lucide for icons.
- **Mobile first**: check your change at phone width (~390px) and on desktop.
- **Accessibility**: keep labels, roles and keyboard navigation working.
- **Prompts**: if you change a hat's system prompt in `src/lib/groq.ts`, keep the JSON output contract (`blindspot`, `fatalHypothesis`, `uncomfortableQuestions` (exactly 2), `pivotSignal`).
- Write clear commit messages, e.g. `feat: add export to PDF`, `fix: handle HEIC images`.

## Reporting bugs and ideas

Use the [issue templates](https://github.com/FelipeMachado25/AI-Challenger/issues/new/choose). For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
