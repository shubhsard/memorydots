# memorydots

A two-player memory game on a 5x5 grid of dots. Players take turns replaying a growing
sequence and adding one new dot; the first to forget loses.

The rules, modes and decisions live in [GAME_SPEC.md](./GAME_SPEC.md), the single source of truth.

## Layout

```
packages/
  engine/   pure game rules (types, applyEvent, bots, tests); no framework code
apps/
  web/      Next.js app: Local, Bot, Learn, and the Remote client
  server/   game server for Remote and Random modes
  cli/      terminal adapter over the engine
```

Every app imports the engine as `@memorydots/engine`. The engine is never deployed on its own;
each app bundles it at build time.

## Commands (from the repo root)

```
npm install       # install everything and link the workspaces
npm test          # run tests in every package
npm run build     # build every package
npm run typecheck # typecheck every package
```