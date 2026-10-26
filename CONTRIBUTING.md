# Contributing

Bug reports, documentation fixes and pull requests are welcome.

## Setup

You need Node.js 22.12 or later and npm 11 or later.

```bash
git clone https://github.com/halitsever/nest-cloudflare-turnstile.git
cd nest-cloudflare-turnstile
npm ci
```

Use npm 11 when you add or update dependencies. The docs site and the test runner need different esbuild versions, and npm 10 can write a lockfile that `npm ci` then rejects.

## Scripts

| Command                | What it does                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm test`             | Unit and end-to-end tests against a mocked siteverify endpoint          |
| `npm run test:live`    | Calls the real siteverify endpoint with Cloudflare's test keys          |
| `npm run typecheck`    | Type-checks the library and the tests                                   |
| `npm run lint`         | Runs ESLint                                                             |
| `npm run format`       | Formats the repository with Prettier                                    |
| `npm run lint:package` | Builds the package, then checks it with publint and Are The Types Wrong |
| `npm run docs:dev`     | Serves the documentation site locally                                   |

`test/consumer/run.sh <nest-major> <tarball>` installs a packed build into a new app next to the given NestJS major, type-checks a consumer against it and sends real requests. CI runs it for NestJS 10, 11 and 12:

```bash
mkdir -p /tmp/turnstile && npm pack --pack-destination /tmp/turnstile
test/consumer/run.sh 12 /tmp/turnstile/nest-cloudflare-turnstile-*.tgz
```

## Pull requests

- Cover every behavior change with a test.
- Write commit messages in the conventional-commit style of the history, such as `feat:`, `fix:` or `docs:`, and mark breaking changes with `!`.
- Run `npm run lint`, `npm run typecheck` and `npm test` before you push.

## Releases

Maintainers run `npm run release`, which bumps the version, updates `CHANGELOG.md` from the commit messages and tags the commit. Publishing a GitHub release for that tag starts the publish workflow, which uploads the package to npm through trusted publishing.
