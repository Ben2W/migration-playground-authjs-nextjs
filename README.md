# The Auth.js + Next.js Clerk Migrations Playground!

This repository is a playground for exploring migrating from Auth.js to Clerk.

So fork it, clone it, and make it your own!

> **Note:** We use localtunnel to expose `localhost:3005` to the internet. Ensure that port is available.

## Getting Started

```bash
pnpm install
```

```bash
pnpm dev
```

The CLI will setup the .env file for you! If you want to startover, you can run `pnpm delete` to delete the `.env` file and `dev.db` files.

> Deploying this app, or building it with `pnpm build` is not yet supported.

## Enabling Clerk Migrations:

**Heartbeat Endpoint:**
This endpoint is already created for you at `/src/app/api/clerk-migrations/add-active-user`.

**Clerk Migrations Wrapper:**
The root layout is already wrapped by `<ClerkMigrationsWrapper>` in `/src/app/layout.tsx`.

**Get Users by IDs Endpoint:**
This endpoint is already created for you at `/src/app/api/clerk-migrations/get-users-by-ids`.

## Differences in Developer Experience

1. **Local Development with External Access**

   - This app utilizes localtunnel to expose `localhost:3005` to the internet.
   - Note for Users: You may need to implement a similar solution for your dev/staging environments. This app uses `/scripts/next-dev-and-localtunnel.ts` to do this automatically. Check out that file to see how we did it.

2. **Simulating Active Users**

   - This is a feature in the Dev Tools sidebar which allows you to simulate thousands of active users.
   - _Limitation:_ While useful, this simulation may not perfectly replicate production behavior.
