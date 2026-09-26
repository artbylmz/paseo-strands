# paseo-strands

Adds the AWS Strands agent to Paseo over ACP.

## The plugin

`index.server.ts`, in full:

```ts
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { runAcpProvider } from "@getpaseo/plugin/server/acp";

export default function contribute(server: PluginServerContext) {
  server.registerProvider(
    runAcpProvider({
      id: "strands",
      label: "AWS Strands",
      icon: "strands.svg",
      command: ["strands", "--acp-server", "--model", "litellm/stealth/space-bunny-alpha"],
    }),
  );
  return () => {};
}
```

Paseo spawns the process and speaks Agent Client Protocol to it. No Strands
code is imported, so Paseo's plugin build never walks the Strands type graph
and the harness's dependencies stay out of the daemon.

## Icon

`strands.svg` is `site/public/favicon.svg` from
[strands-agents/harness-sdk](https://github.com/strands-agents/harness-sdk) —
the only square mark the project ships. Self-contained: 39 paths, one colour, no
external references, no fixed dimensions. That is what Paseo's `icon` field
asks for, a plugin-directory-relative path to a self-contained SVG.

The other candidates were wrong shape for a square slot — `logo-light.svg` and
`logo-dark.svg` are 290×463 vertical lockups, and the two wordmarks are
1332 and 1512 units wide. This favicon is the squarified, pixel-styled variant
they made for small sizes.

Apache-2.0, © Amazon.com, Inc. or its affiliates. The mark is an Amazon
trademark; using it here identifies the product this plugin drives. Apache-2.0
§4(d) asks that the `NOTICE` attribution travel with redistributions.

## Requirements

```sh
npm install -g @strands-agents/cli
```

## Model

The model is a `--model provider/model` argument, not a saved profile. The
`litellm` provider is the OpenAI-compatible path, so it points at OpenRouter
through the environment:

| Variable | Value |
| --- | --- |
| `LITELLM_BASE_URL` | `https://openrouter.ai/api/v1` |
| `LITELLM_API_KEY` | your OpenRouter key |

Set both on the agent rather than in your shell — Paseo's
`ProviderSessionConfig.env` is passed straight to the spawned process, so the
key stays out of the daemon environment and out of the plugin.

## Install

From a local checkout, use an **absolute** path — a relative path is parsed as a
Git source:

```sh
paseo plugin install /absolute/path/to/paseo-strands
```

From GitHub, no registry registration is needed:

```sh
paseo plugin install https://github.com/you/paseo-aws-strands
```

## Use

```sh
paseo run --provider strands \
  --env LITELLM_BASE_URL=https://openrouter.ai/api/v1 \
  --env LITELLM_API_KEY="$OPENROUTER_KEY" \
  "your task"
```

Or pick **AWS Strands** when creating an agent in the Paseo UI and set the two
variables there.

## Tool surface

The harness ships `shell`, `read`, `write`, `edit`, `web_fetch`, and `subagent`
enabled by default, and ACP-server mode never prompts before running them. A
Strands session can write files and run commands in the session's working
directory without asking. Give it a directory you are willing to let an agent
modify.

To narrow it, add `--builtin-tools` to the command tuple, for example
`"--builtin-tools", "read,write"`.

The CLI also writes `.agent/sessions/<id>/` into whatever working directory the
session runs in, so each agent leaves a `.agent/` directory behind. Add
`"--session", "off"` to the command tuple to stop that, or gitignore
`.agent/`.

## Known wart

Paseo gives a closing ACP process 1s to answer `SIGTERM` and 1s more to answer
`SIGKILL`, then reports `ACP provider strands did not terminate after SIGKILL`
and fails operations like `paseo archive`. The process does exit — the check
just gives up first. Expect that error on teardown; it does not leave orphans.
