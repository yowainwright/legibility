# Contributing

## Before you start

Open an issue for a larger change. Small fixes can go straight into a pull
request.

## Local checks

Use Node 26 and pnpm for development. The published package supports Node 24
and newer:

```sh
pnpm install
pnpm run check
pnpm run test
pnpm run test:e2e
```

Pull requests should explain what changed, why it changed, and how it was
tested. Link the related issue when there is one.
