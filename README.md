# De-Journey

Portfolio site with a Vercel serverless contact API and Neon Postgres database.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Create a Neon Postgres project and run [`db/schema.sql`](db/schema.sql) in its SQL Editor.
3. In Vercel project settings, add the Neon connection string as `DATABASE_URL` (use `.env.example` as the format reference).
4. Deploy. The contact form saves submissions in the `contact_messages` table.

`DATABASE_URL` is intentionally excluded from Git. Do not add database credentials to the repository.
