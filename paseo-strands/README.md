# paseo-strands

Adds the AWS Strands agent to Paseo over ACP.

## The plugin

`index.server.ts` is one `runAcpProvider` call: it spawns
`strands --acp-server --model litellm/stealth/space-bunny-alpha`, adds
`--env-file ~/.strands/cli/.env` when that file exists, and uses a `discover` /
`configure` transformer to give Paseo's model picker the pinned model.

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

Pinned to OpenRouter's `stealth/space-bunny-alpha` (1M context) through
`--model litellm/stealth/space-bunny-alpha`. This flag overrides
`profile.model` in `~/.strands/cli/config.json`. The config still supplies the
provider and base URL:

```json
{
  "providers": {
    "enabled": ["litellm"],
    "environment": {
      "LITELLM_BASE_URL": "https://openrouter.ai/api/v1"
    }
  }
}
```

The strands ACP server returns only a `sessionId` from `session/new`. It sends
no `models` and no `configOptions`, and it has no set-model method. Paseo
therefore has nothing to list and its model picker stays empty. The plugin's
`discover` transformer advertises the pinned model as the only, default entry.
`configure` accepts selecting that model and passes every other change to the
bridge. To change models, edit `model` in `index.server.ts` and run
`paseo plugin reload paseo-strands`.

## Credentials

`strands` deletes every credential key (`LITELLM_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, AWS keys, ...) from `config.json` when it reads it. A key
can only come from the process environment or an explicit `--env-file`. The
plugin passes `--env-file ~/.strands/cli/.env` when that file exists:

```sh
install -m 600 /dev/null ~/.strands/cli/.env
echo 'LITELLM_API_KEY=<your OpenRouter key>' >> ~/.strands/cli/.env
paseo plugin reload paseo-strands   # the file is checked at plugin load
```

A key exported in the Paseo daemon's environment also works, because spawned
sessions inherit it. So does `paseo run --env LITELLM_API_KEY=...`.

Without a key, the first prompt fails. Paseo shows only
`[System Error] Internal error` and drops the ACP error's `data.details`, which
holds the real cause:

| State | `data.details` |
| --- | --- |
| No base URL, no key | `Connection error.` |
| Base URL, no key | `401 Missing Authentication header` |
| Wrong key | `401 User not found.` |

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
paseo run --provider strands "your task"
```

Or pick **AWS Strands** when creating an agent in the Paseo UI.

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
