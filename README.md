# De-Journey

Portfolio site with NVIDIA-powered chat and image tools, plus a Vercel contact API backed by Neon Postgres.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Create a Neon Postgres project and run [`db/schema.sql`](db/schema.sql) in its SQL Editor.
3. Create an API key at [NVIDIA Build](https://build.nvidia.com/settings/credits), accepting the model terms for FLUX.1-schnell when prompted.
4. In Vercel project settings, add `NVIDIA_API_KEY` and the Neon connection string as `DATABASE_URL` (use [`.env.example`](.env.example) as the format reference). You may also set `NVIDIA_CHAT_MODEL` to another NVIDIA chat model.
5. Deploy. Chat uses NVIDIA's chat-completions API; image generation uses NVIDIA's FLUX.1-schnell endpoint. The contact form saves submissions in the `contact_messages` table.

`DATABASE_URL` and `NVIDIA_API_KEY` are intentionally excluded from Git. Do not add credentials to the repository.
