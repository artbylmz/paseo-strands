import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { runAcpProvider } from "@getpaseo/plugin/server/acp";

// strands strips credentials from its config.json; this env file is where they live.
const envFile = join(homedir(), ".strands", "cli", ".env");
const model = "litellm/stealth/space-bunny-alpha";

export default function contribute(server: PluginServerContext) {
  server.registerProvider(
    runAcpProvider({
      id: "strands",
      label: "AWS Strands",
      icon: "strands.svg",
      command: [
        "strands",
        "--acp-server",
        "--model",
        model,
        ...(existsSync(envFile) ? ["--env-file", envFile] : []),
      ],
      // strands' ACP server advertises no models and cannot switch them, so Paseo's
      // picker is empty. Advertise the pinned model and accept only that choice.
      transformers: [
        {
          discover: (catalog) => ({
            ...catalog,
            models: [{ id: model, label: "Space Bunny Alpha", isDefault: true, contextWindowMaxTokens: 1_000_000 }],
            defaultModel: model,
          }),
          configure: async (change) => (change.target === "model" && change.value === model ? "handled" : "pass"),
        },
      ],
    }),
  );
  return () => {};
}
