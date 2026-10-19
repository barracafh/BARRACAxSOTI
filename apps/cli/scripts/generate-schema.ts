import { z } from "zod";
import { fichaSchema } from "@buildnight/shared/modelo";
await Bun.write(
  new URL("../esquemas/ficha.schema.json", import.meta.url),
  JSON.stringify(
    z.toJSONSchema(fichaSchema, { unrepresentable: "any" }),
    null,
    2,
  ) + "\n",
);
