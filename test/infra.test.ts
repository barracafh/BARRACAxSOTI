import { expect, test } from "bun:test";
import { join } from "node:path";
import { executePlan, options, root } from "../infra/common";
import { registryPlan } from "../infra/registro/preparar";

test("registro: dry-run no ejecuta; siembra JSON, etiquetas y revisiones del comité", async () => {
  const plan = await registryPlan("example/registro", "@example/comite");
  let calls = 0;
  const messages: string[] = [];
  await executePlan(
    plan,
    false,
    async () => {
      calls++;
    },
    (message) => messages.push(message),
  );
  expect(calls).toBe(0);
  expect(messages.join("\n")).toContain("'gh' 'repo' 'create'");
  expect(JSON.parse(plan.files["equipos.json"]!)).toEqual([]);
  expect(plan.files["tracks.json"]).toBe(
    await Bun.file(
      join(root, "packages/shared/registro-base/tracks.json"),
    ).text(),
  );
  expect(plan.files[".github/CODEOWNERS"]).toContain(
    "/equipos.json @example/comite",
  );
  expect(plan.files[".github/CODEOWNERS"]).toContain(
    "/.github/CODEOWNERS @example/comite",
  );
  expect(
    plan.commands
      .filter((command) => command.args[1] === "label")
      .map((command) => command.args[3]),
  ).toEqual(["aviso", "tablon"]);
  const protection = JSON.parse(plan.commands.at(-1)!.input!);
  expect(
    protection.required_pull_request_reviews.require_code_owner_reviews,
  ).toBe(true);
  expect(protection.enforce_admins).toBe(true);
  expect(protection.allow_force_pushes).toBe(false);
  expect(protection.allow_deletions).toBe(false);
  expect(options([], []).apply).toBe(false);
  expect(() => options([], ["--apply", "--dry-run"])).toThrow();
  expect(() => options([], ["--aply"])).toThrow();
});
