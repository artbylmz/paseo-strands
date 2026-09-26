import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { runAcpProvider } from "@getpaseo/plugin/server/acp";

const strandsDir = join(homedir(), ".strands", "cli");
// strands strips credentials from config.json; this env file is where they live.
const envFile = join(strandsDir, ".env");

/** The model strands will run: `profile.model` from its own config, if set. */
async function configuredModel(): Promise<string | undefined> {
  try {
    const config = JSON.parse(await readFile(join(strandsDir, "config.json"), "utf8"));
    const model = config?.profile?.model;
    return typeof model === "string" && model ? model : undefined;
  } catch {
    return undefined;
  }
}

const modelError = (model = "its default model") =>
  new Error(`strands runs ${model}; set profile.model in ~/.strands/cli/config.json to change it`);

export default function contribute(server: PluginServerContext) {
  // Reject before spawning: a failed initial config makes the ACP bridge kill strands,
  // and its teardown error hides this message.
  server.before("agent.create", async ({ request }) => {
    if (request.config.provider !== "strands" || !request.config.model) return;
    const model = await configuredModel();
    if (model && request.config.model !== model) throw modelError(model);
  });
  server.registerProvider(
    runAcpProvider({
      id: "strands",
      label: "AWS Strands",
      icon: "strands.svg",
      command: ["strands", "--acp-server", ...(existsSync(envFile) ? ["--env-file", envFile] : [])],
      // strands' ACP server advertises no models and cannot switch them, so Paseo's
      // picker would be empty. Show the model strands is configured to use.
      transformers: [
        {
          async discover(catalog) {
            const model = await configuredModel();
            if (!model) return catalog;
            return { ...catalog, models: [{ id: model, label: model, isDefault: true }], defaultModel: model };
          },
          async configure(change) {
            if (change.target !== "model") return "pass";
            const model = await configuredModel();
            if (change.value === model) return "handled";
            throw modelError(model);
          },
        },
      ],
    }),
  );
  return () => {};
}
