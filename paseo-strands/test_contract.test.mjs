import assert from "node:assert/strict";
import test from "node:test";

test("strands.run rejects an empty prompt", async () => {
  const { strandsRun } = await import("./shared/strands.ts");
  const ok = strandsRun.input.safeParse({ agentId: "a1", prompt: "hi" });
  const empty = strandsRun.input.safeParse({ agentId: "a1", prompt: "" });
  const noModel = strandsRun.input.safeParse({ agentId: "a1", prompt: "hi", model: undefined });
  assert.equal(ok.success, true);
  assert.equal(empty.success, false, "empty prompt must be rejected before any model call");
  assert.equal(noModel.success, true, "model must stay optional");
});
