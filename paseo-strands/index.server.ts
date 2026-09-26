import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { runAcpProvider } from "@getpaseo/plugin/server/acp";

// strands strips credentials from its config.json; this env file is where they live.
const envFile = join(homedir(), ".strands", "cli", ".env");

export default function contribute(server: PluginServerContext) {
  server.registerProvider(
    runAcpProvider({
      id: "strands",
      label: "AWS Strands",
      icon: "strands.svg",
      command: ["strands", "--acp-server", ...(existsSync(envFile) ? ["--env-file", envFile] : [])],
    }),
  );
  return () => {};
}
