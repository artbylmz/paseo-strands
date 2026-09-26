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
