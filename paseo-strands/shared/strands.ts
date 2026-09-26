import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const strandsRun = defineRpc({
  name: "strands.run",
  input: z.object({
    agentId: z.string(),
    prompt: z.string().min(1),
    model: z.string().optional(),
  }),
  output: z.object({ text: z.string() }),
});
