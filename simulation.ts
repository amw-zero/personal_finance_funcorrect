import { Client, CreateRecurringTransaction, EditRecurringTransaction, RecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("1991-01-01T00:00:00.000Z");

Deno.test("addRecurringTransaction", async (t) => {  
  let recurrenceRule = fc.oneof(
    fc.record({ recurrenceType: fc.constant("monthly"), day: fc.integer({min: 0, max: 31}) }),
    fc.record({ 
      recurrenceType: fc.constant("weekly"), 
      day: fc.integer({min: 0, max: 31 }), 
      basis: fc.option(fc.date({min: dateMin, max: dateMax})),
      interval: fc.option(fc.integer({min: 1, max: 60})) 
    })
  );

  let recurringTransaction = fc.record({
    id: fc.integer({ min: 1, max: 20 }),
    name: fc.string(),
    amount: fc.integer(),
    recurrenceRule:  recurrenceRule,
  });

  let createRecurringTransaction = fc.record({ 
    name: fc.string(), 
    amount: fc.integer(), 
    recurrenceRule: fc.oneof(
      fc.record({ recurrenceType: fc.constant("monthly"), day: fc.integer({min: 0, max: 31}) }),
      fc.record({ 
        recurrenceType: fc.constant("weekly"), 
        day: fc.integer({min: 0, max: 31 }), 
        basis: fc.option(fc.date({min: dateMin, max: dateMax})),
        interval: fc.option(fc.integer({min: 1, max: 60})) 
      }),
    )
  });

  let state = fc.record({
    recurringTransactions: fc.array(recurringTransaction),
    createRecurringTransaction,
  });

  await fc.assert(
    fc.asyncProperty(state, async (state: { recurringTransactions: RecurringTransaction[], createRecurringTransaction: CreateRecurringTransaction }) => {
      let client = new Client();

      // have to apply this state to DB too
      client.recurringTransactions = state.recurringTransactions;
      await client.setup();

      let model = new Budget();
      model.recurringTransactions = state.recurringTransactions;

      await client.addRecurringTransaction(state.createRecurringTransaction);
      model.addRecurringTransaction(state.createRecurringTransaction);

      await t.step("Checking invariants between model and implementation", async (t) => {
        await t.step("UI State", async (t) => {
          await t.step("loading", async () => {
            assertEquals(client.loading, false);
          })
          await t.step("error", async () => {
            assertEquals(client.error, model.error);
          });
        });

        await t.step("Recurring transactions are equal", async () => {
          assertEquals(client.recurringTransactions, model.recurringTransactions);
        });

        await t.step("Scheduled transactions are equal", async () => {
          assertEquals(client.scheduledTransactions, model.scheduledTransactions);
        });
      });

      await client.teardown();
    }),
    { numRuns: 100 }
  );
});
