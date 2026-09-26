# Changelog

## 0.1.0 - 2026-09-26

- Adds the **AWS Strands** provider, which runs `strands --acp-server` over ACP.
- Loads credentials from `~/.strands/cli/.env` when that file exists.
- Shows the `profile.model` from `~/.strands/cli/config.json` in Paseo's model
  picker. Picking any other model returns a clear error.
