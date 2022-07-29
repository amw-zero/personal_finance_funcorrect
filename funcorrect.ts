import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

Deno.test("functional correctness", async (t) => {
  let client = new Client();

  await fc.assert(fc.asyncProperty(fc.string(), async (text: string) => {
    let model = new Budget();
    client = new Client();
    
    let rt: CreateRecurringTransaction = { name: "idk", amount: 15.0, recurrenceRule: { recurrenceType: "monthly", day: 2 } };

    model.addRecurringTransaction(rt);
    model.viewRecurringTransactions()

    await client.addRecurringTransaction(rt);
    await client.viewRecurringTransactions()

    return true;
  }).beforeEach(() => {
    return client.setup()
  }).afterEach(() => {
    return client.teardown();
  }));
});
