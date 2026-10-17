import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const braces = require("braces");

describe("brace nesting security boundary", () => {
  it("keeps normal patterns and ranges", () => {
    expect(braces.expand("src/{app,lib}/*.{ts,tsx}")).toEqual([
      "src/app/*.ts", "src/app/*.tsx", "src/lib/*.ts", "src/lib/*.tsx",
    ]);
    expect(braces.expand("{1..3}")).toEqual(["1", "2", "3"]);
  });

  it("rejects deeply nested strings before stack exhaustion", () => {
    const pattern = "{".repeat(1500) + "a,b" + "}".repeat(1500);
    for (const operation of [braces.parse, braces.compile, braces.expand]) {
      expect(() => operation(pattern)).toThrow("Brace nesting exceeds security limit");
    }
  });

  it("bounds direct AST walkers", () => {
    type Ast = { type: string; value?: string; nodes?: Ast[] };
    let ast: Ast = { type: "text", value: "x" };
    for (let index = 0; index < 1000; index++) {
      ast = { type: "root", nodes: [ast] };
    }
    for (const operation of [braces.compile, braces.expand, braces.stringify]) {
      expect(() => operation(ast)).toThrow("Brace nesting exceeds security limit");
    }
  });
});
