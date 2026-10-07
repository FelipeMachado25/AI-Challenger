# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately via GitHub: **Security → Advisories → [Report a vulnerability](https://github.com/FelipeMachado25/AI-Challenger/security/advisories/new)**.

Include a description, steps to reproduce and the potential impact. You'll get a response as soon as possible.

## Handling secrets

- `GROQ_API_KEY` must only ever be set as a server environment variable (`.env.local` locally, Vercel Environment Variables in production).
- Never commit `.env*` files, and never prefix the key with `NEXT_PUBLIC_`.
- If a key is ever exposed, revoke it immediately at [console.groq.com/keys](https://console.groq.com/keys) and create a new one.
