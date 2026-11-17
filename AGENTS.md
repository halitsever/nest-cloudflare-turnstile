# AGENTS.md

nest-cloudflare-turnstile is an npm library that NestJS backends use to verify Cloudflare Turnstile captcha tokens in a guard. It runs in production apps, so every behavior change needs a test and a note in the PR.

## Verify a change

CI (`.github/workflows/ci.yml`) runs these, in this order:

- `npm ci`
- `npm run lint`, `npm run format:check`, `npm run typecheck`
- `npm run lint:package` (builds `dist/`, then runs publint and attw), then `npm pack`
- `npm run docs:build`
- `npm test` on Node 22, 24 and 26 with Nest 12, and on Node 22 with Nest 10 and 11. The job swaps the Nest major in with `npm install --no-save @nestjs/common@<major> @nestjs/core@<major> ...`
- `npm run test:live`, which calls Cloudflare's real siteverify endpoint and needs network access
- `test/consumer/run.sh <nest-major> <absolute path to .tgz>` installs the packed tarball into a fresh app. CONTRIBUTING.md has the local recipe.

## Gotchas

- `npm ci` runs `prepare`, which installs a husky pre-commit hook. `pretty-quick --staged` reformats staged files during `git commit`, so check `git show --stat HEAD` afterwards.
- Use npm 11 when you add or update dependencies. npm 10 can write a lockfile that `npm ci` rejects, because the docs site and the test runner need different esbuild versions (`overrides` pins vite for vitepress).
- `npm test` mocks siteverify with MSW. Only `npm run test:live` touches the network.
- `CHANGELOG.md` is written by changelogen during a release and is excluded from Prettier.
- The publish workflow runs on a published GitHub release and stops unless the tag equals `v` plus the package.json version. It publishes through npm trusted publishing (OIDC), with no token.

## Docs site

- VitePress source lives in `docs/`, with the config in `docs/.vitepress/config.mts` and base `/nest-cloudflare-turnstile/`. It is served at https://halitsever.github.io/nest-cloudflare-turnstile/ with `.html` page URLs (cleanUrls is off).
- `.github/workflows/docs.yaml` deploys on pushes to `main` that touch `docs/**`. The build output and cache under `docs/.vitepress/` are ignored.
- A new page needs a `description` line in its frontmatter, a sidebar entry in the config and a line in `docs/public/llms.txt`. The sitemap, canonical and `og:url` tags are generated.

## Conventions

- Commit messages are a conventional-commit subject line in English, with no body and no trailer.
- Work on a branch and open a PR against `main`. The owner merges.
- New text carries no emoji. Code comments stay short, one line where possible, and explain why.
- The README follows the owner's template. Every image served from `halitsever-api.vercel.app` stays byte-for-byte. Only the `title=` value of `api/repo-title` and the link around `api/issue` may be corrected.
- The owner bumps versions, runs `npm run release` and publishes to npm.
