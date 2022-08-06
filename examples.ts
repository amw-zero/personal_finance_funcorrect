
import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

Deno.test("Boundary dates when viewing scheduled transactions", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("December 14th example", async () => {
    let crt: CreateRecurringTransaction = { name: "test", amount: 50.0, recurrenceRule: { recurrenceType: "monthly", day: 14 }};
    model.addRecurringTransaction(crt);
    await client.addRecurringTransaction(crt);

    let startDate = new Date("Wed May 23 1990 02:15:24 GMT-0400");
    let endDate = new Date("Fri Dec 14 1990 02:17:00 GMT-0500");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});