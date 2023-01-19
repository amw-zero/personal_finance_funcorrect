import { Client, CreateRecurringTransaction, EditRecurringTransaction, RecurringTransaction, DBState } from './react_ui/src/state.ts';
import { Budget, dateStringFromDate } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("1991-01-01T00:00:00.000Z");

// Defined in spec
export async function check(client: Client, model: Budget, t: Deno.TestContext) {
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
}

type AddRecurringTransactionState = {
  recurringTransactions: RecurringTransaction[];
  db: DBState;
  createRecurringTransaction: CreateRecurringTransaction;
}

type ViewScheduledTransactionsState = {
  recurringTransactions: RecurringTransaction[];
  db: DBState;
  start: Date;
  end: Date;
}

export function runTests() {

Deno.test("addRecurringTransaction", async (t) => {  
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
    recurringTransactions,
    db: fc.record({
      recurring_transactions: recurringTransactions,
    }),
    createRecurringTransaction,
  });

  await fc.assert(
    fc.asyncProperty(state, async (state: AddRecurringTransactionState) => {
      console.log("addRecurringTransaction state", JSON.stringify(state, null, 2));
      let client = new Client();

      try {
        client.recurringTransactions = state.recurringTransactions;
        const cresp = await client.setup(state.db);
        // Deno-specific fetch waiting
        await cresp.arrayBuffer();

        let model = new Budget();
        model.recurringTransactions = state.db.recurring_transactions;

        // ID generation has to match. Kind of a pain.
        if (state.db.recurring_transactions.length > 0) {
          const lastId = Math.max(...state.db.recurring_transactions.map((rt: RecurringTransaction) => rt.id));
          model.ids["RecurringTransaction"] = lastId;
        }

        await client.addRecurringTransaction(state.createRecurringTransaction);
        model.addRecurringTransaction(state.createRecurringTransaction);

        await check(client, model, t);
      } catch(e) {
        console.error(e);
      } finally {
        await client.teardown();
      }
    }),
    { numRuns: 0, endOnFailure: true }
  );
});

Deno.test("viewScheduledTransactions", async (t) => {  
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

  const start = fc.date({min: dateMin, max: dateMax});
  const end = fc.date({min: dateMin, max: dateMax});

  let state = fc.record({
    recurringTransactions,
    db: fc.record({
      recurring_transactions: recurringTransactions,
    }),
    start,
    end,
  });

  await fc.assert(
    fc.asyncProperty(state, async (state: ViewScheduledTransactionsState) => {
      console.log("viewScheduledTransactions state", JSON.stringify(state, null, 2));
      let client = new Client();

      try {
        client.recurringTransactions = state.recurringTransactions;
        const cresp = await client.setup(state.db);
        // Deno-specific fetch waiting
        await cresp.arrayBuffer();

        let model = new Budget();
        model.recurringTransactions = state.db.recurring_transactions;

        // ID generation has to match. Kind of a pain.
        if (state.db.recurring_transactions.length > 0) {
          const lastId = Math.max(...state.db.recurring_transactions.map((rt: RecurringTransaction) => rt.id));
          model.ids["RecurringTransaction"] = lastId;
        }

        await client.viewScheduledTransactions(state.start, state.end);
        model.viewScheduledTransactions(state.start, state.end);

        await check(client, model, t);
      } catch(e) {
        console.error(e);
      } finally {
        await client.teardown();
      }
    }),
    { numRuns: 50, endOnFailure: true }
  );
});

}