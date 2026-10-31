# Contributing to CloudMeet

CloudMeet is a self-hosted meeting scheduler built with SvelteKit and deployed
to Cloudflare. Contributions should stay focused, preserve existing behavior,
and include enough verification for a maintainer to reproduce the result.

## Development Setup

Use Node.js 22, which is the version used by CI.

```bash
npm ci
cp .env.example .dev.vars
npm run db:init
npm run dev:watch
```

The local database command requires Wrangler and a configured local
Cloudflare environment. Never commit `.dev.vars`, OAuth credentials, API
tokens, or production database identifiers.

## Before Opening a Pull Request

Run:

```bash
npm ci
npm run build
```

For interface changes, also verify the booking flow and dashboard in a browser.
For database changes, add a new migration instead of rewriting an existing
migration that may already be deployed.

## Pull Request Guidelines

- Use a short, descriptive branch name.
- Keep unrelated refactors and formatting changes out of the same pull request.
- Write commit messages in English and prefer Conventional Commits, such as
  `fix: validate booking timezone`.
- Describe user-visible changes, deployment impact, and verification steps.
- Do not include secrets, exported user data, or generated build artifacts.
- Report security issues privately as described in `SECURITY.md`.

Maintainers may ask for a smaller patch or additional deployment verification
before merging.
