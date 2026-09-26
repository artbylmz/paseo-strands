import type { PluginClientContext } from "@getpaseo/plugin/client";
import { strandsRun } from "./shared/strands";

export default function contribute(client: PluginClientContext) {
  client.addSlashCommand({
    name: "strands",
    description: "Run an AWS Strands harness agent and post its answer back to this agent",
    argumentHint: "<prompt>",
    context: "agent",
    async onSubmit({ args, agent, rpc }) {
      await rpc(strandsRun, { agentId: agent.id, prompt: args });
    },
  });
  return () => {};
}
