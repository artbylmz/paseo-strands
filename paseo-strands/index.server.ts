import { createHarness } from "@strands-agents/harness";
import type { RpcInput } from "@getpaseo/plugin";
import type { PluginServerContext } from "@getpaseo/plugin/server";
import { strandsRun } from "./shared/strands";

export default function contribute(server: PluginServerContext) {
  server.handle(
    strandsRun,
    async ({ agentId, prompt, model }: RpcInput<typeof strandsRun>, { paseo }) => {
      const agent = await createHarness({ ...(model ? { model } : {}), session: false });
      const text = (await agent.invoke(prompt)).lastMessage.content
        .flatMap((b) => (b.type === "textBlock" ? [b.text] : []))
        .join("");
      await paseo.agents.ref(agentId).send(text);
      return { text };
    },
  );
  return () => {};
}
