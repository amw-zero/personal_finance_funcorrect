import { Client, DBState, CreateRecurringTransaction, EditRecurringTransaction, RecurringTransaction } from './react_ui/src/state.ts';
import { Budget, dateStringFromDate } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

import { runTests } from './simulationtests.ts';

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("1991-01-01T00:00:00.000Z");

// runTests();

// Action State 
type DeleteRecurringTransactionState = {
  recurringTransactions: RecurringTransaction[];
  id: number;
  db: DBState;
}

Deno.test("deleteRecurringTransaction", async (t) => {  
  let recurrenceRule = fc.oneof(
    fc.record({ recurrenceType: fc.constant("monthly"), day: fc.integer({min: 0, max: 31}) }),
    fc.record({ 
      recurrenceType: fc.constant("weekly"), 
      day: fc.integer({min: 0, max: 31 }), 
      basis: fc.option(fc.date({min: dateMin, max: dateMax}).map((d: Date) => dateStringFromDate(d))),
      interval: fc.option(fc.integer({min: 1, max: 60})) 
    })
  );

  let recurringTransaction = fc.record({
    id: fc.integer({ min: 1, max: 20 }),
    name: fc.string(),
    amount: fc.integer(),
    recurrenceRule:  recurrenceRule,
  });

  let recurringTransactions = fc.uniqueArray(recurringTransaction, { selector: (v: RecurringTransaction) => v.id });

  // Relies on TestState.db = d => setup(DB, d) = d
  let state = fc.record({
    recurringTransactions,
    id: fc.integer({ min: 1, max: 4 }),
    db: fc.record({
      recurring_transactions: recurringTransactions,
    })
  });

  await fc.assert(
    fc.asyncProperty(state, async (state: DeleteRecurringTransactionState) => {
      console.log("Delete state", JSON.stringify(state, null, 2));
      let client = new Client();

      client.recurringTransactions = state.recurringTransactions;
      const cresp = await client.setup(state.db);

      // Deno-specific fetch waiting
      await cresp.arrayBuffer();

      let model = new Budget();
      for (let rt of state.db.recurring_transactions) {
        model.addTestRecurringTransaction(rt);
      }

      await client.deleteRecurringTransaction(state.id);
      model.deleteRecurringTransaction(state.id);

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
          if (model.error === null) {
            // This forces a data sync after each action. This is a design decision,
            // there are probably other reasonable choices.
            assertEquals(client.recurringTransactions, model.recurringTransactions);
          }
        });

        await t.step("Scheduled transactions are equal", async () => {
          if (model.error === null) {
            assertEquals(client.scheduledTransactions, model.scheduledTransactions);
          }
        });
      });

      await client.teardown();
    }),
    { numRuns: 100, endOnFailure: true }
  );
});


// Action State 
type ViewRecurringTransactionState = {
  recurringTransactions: RecurringTransaction[], 
  db: DBState,
}

Deno.test("viewRecurringTransactions", async (t) => {
  let recurrenceRule = fc.oneof(
    fc.record({ recurrenceType: fc.constant("monthly"), day: fc.integer({min: 0, max: 31}) }),
    fc.record({ 
      recurrenceType: fc.constant("weekly"), 
      day: fc.integer({min: 0, max: 31 }), 

      // The call to serialize date is application-specific logic here. Either need to allow user to 
      // provide, or solve this in the compiler somehow.
      basis: fc.option(fc.date({min: dateMin, max: dateMax}).map((d: Date) => dateStringFromDate(d))),
      interval: fc.option(fc.integer({min: 1, max: 60})) 
    })
  );

  let recurringTransaction = fc.record({
    id: fc.integer({ min: 1, max: 20 }),
    name: fc.string(),
    amount: fc.integer(),
    recurrenceRule:  recurrenceRule,
  });

  let recurringTransactions = fc.uniqueArray(recurringTransaction, { selector: (v: RecurringTransaction) => v.id });

  let state = fc.record({
    recurringTransactions,

    // DB state needs to be set in the model as well as sent to server
    // DB state 
    //  |-- Model
    //       |-- RecurringTransaction
    //  |-- Server
    //       |-- CreateRecurringTransaction + ID
    // 
    // The issue is that the RecurringTransaction type has an ID but uses the normalized DateString representation
    // CreateRecurringTransaction has no ID, but uses a serialized Date format - need this 
    db: fc.record({
      recurring_transactions: recurringTransactions,
    })
  });

  await fc.assert(
    fc.asyncProperty(state, async (state: ViewRecurringTransactionState) => {
//      console.log(JSON.stringify(state, null, 2));
      let client = new Client();
      try {
        // Initial state setup 
        client.recurringTransactions = state.recurringTransactions;
        let cresp = await client.setup(state.db);

        // Deno-specific fetch waiting
        await cresp.arrayBuffer();

        let model = new Budget();
        for (let rt of state.db.recurring_transactions) {
          model.addTestRecurringTransaction(rt);
        }

        // Perform Action
        await client.viewRecurringTransactions();
        model.viewRecurringTransactions();

        // Assert results
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
      } catch (e) {
        console.log("Test body err");
        console.log(e);
      } finally {
        await client.teardown();
      }
    }),
    { numRuns: 100, endOnFailure: true }
  );
});
