import { Client, DBState, CreateRecurringTransaction, EditRecurringTransaction, RecurringTransaction } from './react_ui/src/state.ts';
import { Budget, dateStringFromDate } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

import { runTests, check } from './simulationtests.ts';

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("1991-01-01T00:00:00.000Z");

runTests();

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
      model.recurringTransactions = state.db.recurring_transactions;

      await client.deleteRecurringTransaction(state.id);
      model.deleteRecurringTransaction(state.id);

      await check(client, model, t);

      await client.teardown();
    }),
    { numRuns: 0, endOnFailure: true }
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
        model.recurringTransactions = state.db.recurring_transactions;

        // Perform Action
        await client.viewRecurringTransactions();
        model.viewRecurringTransactions();

        await check(client, model, t);
      } catch (e) {
        console.log("Test body err");
        console.log(e);
      } finally {
        await client.teardown();
      }
    }),
    { numRuns: 0, endOnFailure: true }
  );
});
