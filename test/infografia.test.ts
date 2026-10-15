import { expect, test } from "bun:test";
import { generateIndex, headings, indexPath } from "../scripts/infografia";

test("el índice de la infografía está al día con los Markdown", async () => {
  expect(await Bun.file(indexPath).text()).toBe(await generateIndex());
});

test("las anclas siguen la regla de GitHub", () => {
  const md = [
    "## 2.3 API pública",
    "```",
    "## dentro de código",
    "```",
    "### Patrón «lo financia X» y `abierto`",
    "## Fuentes",
    "## Fuentes",
  ].join("\n");
  expect(headings(md)).toEqual([
    [2, "2.3 API pública", "23-api-pública"],
    [3, "Patrón «lo financia X» y abierto", "patrón-lo-financia-x-y-abierto"],
    [2, "Fuentes", "fuentes"],
    [2, "Fuentes", "fuentes-1"],
  ]);
});
