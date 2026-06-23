# Host Slides core tests

The Host Slides pure logic uses Vitest with the Node environment. React UI,
Supabase, storage, and uploads are intentionally outside this suite.

- Run once: `npm test`
- Watch while developing: `npm run test:watch`

Tests live beside the parser, sequence builder, and validation modules as
`*.test.ts` files. The `@/` alias is configured in `vitest.config.ts` to match
the application TypeScript setup.
