
//import { test } from "jest"
import { Test } from './react_ui/src/state.ts';

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

const contains = (text: string, pattern: string): boolean => text.indexOf(pattern) >= 0;

Deno.test("url test", async () => {
  let t = await Test();
  console.log({t})
  const url = new URL("./foo.js", "https://deno.land/");
  assertEquals(url.href, "https://deno.land/foo.js");

  fc.assert(fc.property(fc.string(), (text: string) => {
    return contains(text, text)
  }));
});
