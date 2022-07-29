import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

Deno.test("functional correctness", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("create recurring transactions", async () => {
    let rt: CreateRecurringTransaction = { name: "idk", amount: 15.0, recurrenceRule: { recurrenceType: "monthly", day: 2 } };

    model.addRecurringTransaction(rt);
    model.viewRecurringTransactions()

    await client.addRecurringTransaction(rt);
    await client.viewRecurringTransactions()

    assertEquals(model.recurringTransactions, client.recurringTransactions);
  });

  await client.teardown();

  fc.assert(fc.property(fc.string(), (text: string) => {
    return true;
  }));
});
