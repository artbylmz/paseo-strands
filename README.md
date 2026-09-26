# paseo-strands

Run the [AWS Strands](https://github.com/strands-agents/harness-sdk) agent in
[Paseo](https://paseo.sh). The plugin adds an **AWS Strands** provider that
starts `strands --acp-server` and talks to it over the Agent Client Protocol.
No Strands code is loaded into the Paseo daemon.

## Requirements

- Paseo 0.9 or newer, with plugins enabled (**Settings → Plugins**)
- The Strands CLI on the daemon's `PATH`:

  ```sh
  npm install -g @strands-agents/cli
  strands   # first run: pick a model provider in the setup wizard
  ```

## Install

```sh
paseo plugin install npm:paseo-strands
# or
paseo plugin install github:artbylmz/paseo-strands
```

You can also paste either source into **Settings → Plugins → Plugin source**.

## Configure

### Model

Strands chooses the model, not Paseo. The plugin reads `profile.model` from
`~/.strands/cli/config.json` and shows it as the only entry in Paseo's model
picker. The Strands ACP server cannot switch models per session, so picking any
other model fails with an error that points here.

To change the model, edit the config. For example, to use a model on OpenRouter:

```json
{
  "profile": { "model": "litellm/stealth/space-bunny-alpha" },
  "providers": {
    "enabled": ["litellm"],
    "environment": { "LITELLM_BASE_URL": "https://openrouter.ai/api/v1" }
  }
}
```

New agents use the new model. You don't need to reload the plugin.

### Credentials

Strands deletes credential keys (`LITELLM_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, AWS keys, ...) from `config.json` when it reads it, so keep
them in `~/.strands/cli/.env`. The plugin passes that file to Strands with
`--env-file`:

```sh
install -m 600 /dev/null ~/.strands/cli/.env
echo 'LITELLM_API_KEY=<your key>' >> ~/.strands/cli/.env
paseo plugin reload paseo-strands   # only needed when the file is first created
```

Alternatively, export the key in the Paseo daemon's environment, or pass it for
one run with `paseo run --env LITELLM_API_KEY=...`.

## Use

```sh
paseo run --provider strands "your task"
```

Or choose **AWS Strands** when you create an agent in the Paseo app.

## Security

In ACP mode, Strands runs its built-in tools without asking first. The default
tools are `shell`, `read`, `write`, `edit`, `web_fetch`, and `subagent`, so an
agent can run commands and change files in its working directory. Only give it
directories you are willing to let an agent change. To limit the tools, set
`profile.builtinTools` in the Strands config, for example `["read"]`.

Strands saves session state in `.agent/sessions/` inside each working directory.
Add `.agent/` to your `.gitignore`.

## Troubleshooting

When a prompt fails, Paseo shows only `[System Error] Internal error`. The real
cause is in the ACP error's `data.details`:

| `data.details`                     | Fix                                         |
| ---------------------------------- | ------------------------------------------- |
| `401 Missing Authentication header` | No key. See [Credentials](#credentials).    |
| `401 User not found.`              | The key is wrong or has been revoked.       |
| `Connection error.`                | The provider's base URL is missing or can't be reached. |

If the provider is missing from Paseo, run `paseo plugin ls` and
`paseo plugin logs paseo-strands`. Check that `strands` is on the daemon's
`PATH`.

## License

Apache-2.0. See [LICENSE](LICENSE).

`strands.svg` is the Strands favicon from
[strands-agents/harness-sdk](https://github.com/strands-agents/harness-sdk),
Apache-2.0, © Amazon.com, Inc. or its affiliates. See [NOTICE](NOTICE). The mark
is an Amazon trademark. It is used here only to identify the product this plugin
runs. This plugin is not affiliated with or endorsed by Amazon.
