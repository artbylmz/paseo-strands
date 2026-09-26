# paseo-strands

A Paseo plugin that runs an AWS Strands harness agent and posts its answer back into the
invoking Paseo agent's conversation.

`/strands <prompt>` → RPC `strands.run` → `createHarness()` → `agent.invoke()` →
`paseo.agents.ref(agentId).send(text)`.

The integration is public API on both sides: `createHarness` from `@strands-agents/harness`,
and `PaseoAgentHandle.send` from `@getpaseo/client`. No Strands SDK modification, no custom
sub-shell runner, no PTY — Strands runs in-process inside Paseo's daemon subprocess.

## Status: install is blocked upstream

`paseo plugin install` fails. The source, typecheck, and test all pass; the failure is in
Paseo's install-time type-boundary check.

`@strands-agents/harness@0.1.1` pins `@anthropic-ai/sdk@^0.109.1` as a `peerOptional`.
That version's `internal/types.d.mts` declares a `NotAny<import(...)>` union over seven
speculative relative paths for `undici-types` and seven for `undici`:

```ts
NotAny<import("../../../node_modules/undici-types/index.d.ts.mjs").RequestInit> | ...
```

Neither package ships `index.d.ts.mjs` — they ship `index.d.ts`. Those specifiers are
therefore unresolvable for any consumer on any npm layout. Paseo's
`paseo-plugin-server-runtime-boundary` esbuild plugin walks the type graph and fails on the
first one it cannot resolve:

```
Could not resolve type dependency "../../../node_modules/undici-types/index.d.ts.mjs"
imported by node_modules/@anthropic-ai/sdk/internal/types.d.mts
```

Only `0.109.0` and `0.109.1` exist in the allowed range, so there is no version to upgrade to.
The `NotAny<T>` wrapper means the file contents are irrelevant — the stubs only need to exist.

Fixes, in order of preference:

1. **Upstream** — `strands-agents/harness-sdk` widens its `@anthropic-ai/sdk` peer range, or
   `@anthropic-ai/sdk` stops emitting those speculative relative specifiers. Neither is in this repo.
2. **Node_modules stub** — a `build` step that writes empty `index.d.ts.mjs` files at all 14
   paths. Rejected for now: the seven depths reach `/node_modules` and `/home/node_modules`,
   outside this repo, and the step would re-run on every `paseo plugin install`/`update`.
3. **Drop the harness package** — build from `Agent` plus the harness's individual public tool
   factories (`read`, `write`, `edit`, `makeShell`, `makeSubagent`). Costs ~25-40 more lines
   and gives up the harness's benchmarked defaults for tools, context, sessions, memory, and hooks.

## Requirements

- Paseo `>=0.9.0`, with the global `pluginsEnabled` switch on.
- Model credentials on the **daemon** machine. The harness defaults to
  `bedrock/global.anthropic.claude-opus-5`; override with `/strands` on a Bedrock default, or
  change the default in `index.server.ts`. Without credentials `invoke` throws and the RPC
  rejects — the handler deliberately does not catch, so Paseo shows the error rather than
  posting a blank turn.

## Side effects

`session: false` is set, so runs are not snapshotted. The harness's `memory` and `skills`
defaults are left on, which writes markdown under `./.agent/memory` in the daemon's cwd and
picks up `./.agent/skills` if present. The Paseo agent is already the conversation of record;
pass `memory: false, skills: false` in `createHarness` for a side-effect-free daemon.

## Verify

```bash
npm run typecheck                 # exit 0
node --test test_contract.test.mjs # 1 pass, 0 fail
```
