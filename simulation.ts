import { Client, DBState, CreateRecurringTransaction, EditRecurringTransaction, RecurringTransaction } from './react_ui/src/state.ts';
import { Budget, dateStringFromDate } from "./personalfinance.ts"

import fc from 'https://cdn.skypack.dev/fast-check';

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("1991-01-01T00:00:00.000Z");

// Action State 
type DeleteRecurringTransactionState = {
  recurringTransactions: RecurringTransaction[];
  id: number;
  db: DBState;
}

class Impl {
  db: DBState;
  client: Client;

  aux: AuxiliaryVariables;

  constructor(db: DBState, client: Client, aux: AuxiliaryVariables) {
    this.db = db;
    this.client = client;
    this.aux = aux;
  }

  async deleteRecurringTransaction(id: number) {
    await this.client.deleteRecurringTransaction(id);
    this.aux.clientModel.deleteRecurringTransaction(id);
  }

  async addRecurringTransaction(crt: CreateRecurringTransaction) {
    await this.client.addRecurringTransaction(crt);
    this.aux.clientModel.addRecurringTransaction(crt);
  }

  async viewRecurringTransactions() {
    await this.client.viewRecurringTransactions();
  }

  async viewScheduledTransactions(start: Date, end: Date) {
    await this.client.viewScheduledTransactions(start, end);
  }
}

type AuxiliaryVariables = {
  clientModel: Budget;
}

function refinementMapping(impl: Impl): Budget {
  let budget = new Budget();
  budget.error = impl.client.error;

  budget.recurringTransactions = [...impl.db.recurring_transactions];
  budget.scheduledTransactions = [...impl.client.scheduledTransactions];

  return budget;
}

export async function checkImplActionProperties(impl: Impl, t: Deno.TestContext) {
  await t.step("loading is complete", () => assertEquals(impl.client.loading, false));

  await t.step("write-through cache: client state reflects client model", () => assertEquals(impl.client.recurringTransactions, impl.aux.clientModel.recurringTransactions));
}

export async function checkRefinementMapping(mappedModel: Budget, endModel: Budget, t: Deno.TestContext) {
  await t.step("State is equivalent under the refinement mapping", () => assertEquals(mappedModel, endModel));
}

// Write-through cache
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

  let state = fc.record({
    recurringTransactions,
    id: fc.integer({ min: 1, max: 4 }),
    db: fc.record({
      recurring_transactions: recurringTransactions,
    })
  });

  await fc.assert(
    fc.asyncProperty(state, async (state: DeleteRecurringTransactionState) => {
      let client = new Client();
      client.recurringTransactions = state.recurringTransactions;

      let clientModel = new Budget();
      clientModel.recurringTransactions = state.recurringTransactions;
      // The client state should be equivalent to the model if they both start in the same initial state
      let impl = new Impl(state.db, client, { clientModel });
      let model = refinementMapping(impl);

      const cresp = await client.setup(state.db);
      await cresp.arrayBuffer();

      await impl.deleteRecurringTransaction(state.id);
      model.deleteRecurringTransaction(state.id);

      impl.db.recurring_transactions = await client.dbstate();

      let mappedModel = refinementMapping(impl);

      await checkRefinementMapping(mappedModel, model, t);
      await checkImplActionProperties(impl, t);

      await client.teardown();
    }),
    { numRuns: 10, endOnFailure: true }
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
      console.log(JSON.stringify(state, null, 2));

      let client = new Client();
      client.recurringTransactions = state.recurringTransactions;

      let clientModel = new Budget();
      clientModel.recurringTransactions = state.recurringTransactions;
      // The client state should be equivalent to the model if they both start in the same initial state
      let impl = new Impl(state.db, client, { clientModel });
      let model = refinementMapping(impl);

      const cresp = await client.setup(state.db);
      await cresp.arrayBuffer();

      await impl.viewRecurringTransactions();
      model.viewRecurringTransactions();

      impl.db.recurring_transactions = await client.dbstate();

      let mappedModel = refinementMapping(impl);

      console.log(JSON.stringify(impl, null, 2));

      await checkRefinementMapping(mappedModel, model, t);

      await client.teardown();
    }),
    { numRuns: 10, endOnFailure: true }
  );
});

type AddRecurringTransactionState = {
  recurringTransactions: RecurringTransaction[];
  db: DBState;
  createRecurringTransaction: CreateRecurringTransaction;
}

Deno.test("addRecurringTransaction", async (t: Deno.TestContext) => {  
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

      console.log(JSON.stringify(state, null, 2));

      let client = new Client();
      client.recurringTransactions = state.recurringTransactions;

      let clientModel = new Budget();
      clientModel.recurringTransactions = state.recurringTransactions;
      // The client state should be equivalent to the model if they both start in the same initial state
      // This is write-through cache functionality
      let impl = new Impl(state.db, client, { clientModel });
      let model = refinementMapping(impl);

      const cresp = await client.setup(state.db);
      await cresp.arrayBuffer();

      await impl.viewRecurringTransactions();
      model.viewRecurringTransactions();

      impl.db.recurring_transactions = await client.dbstate();

      let mappedModel = refinementMapping(impl);

      console.log(JSON.stringify(impl, null, 2));

      await checkRefinementMapping(mappedModel, model, t);

      await client.teardown();
    }),
    { numRuns: 10, endOnFailure: true }
  );
});

type ViewScheduledTransactionsState = {
  recurringTransactions: RecurringTransaction[];
  db: DBState;
  start: Date;
  end: Date;
}

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
      console.log("viewSchceduledTransactions state", JSON.stringify(state, null, 2));

      console.log(JSON.stringify(state, null, 2));

      let client = new Client();
      client.recurringTransactions = state.recurringTransactions;

      let clientModel = new Budget();
      let impl = new Impl(state.db, client, { clientModel });
      let model = refinementMapping(impl);

      const cresp = await client.setup(state.db);
      await cresp.arrayBuffer();

      await impl.viewScheduledTransactions(state.start, state.end);
      model.viewScheduledTransactions(state.start, state.end);

      impl.db.recurring_transactions = await client.dbstate();

      let mappedModel = refinementMapping(impl);

      console.log(JSON.stringify(impl, null, 2));

      await checkRefinementMapping(mappedModel, model, t);

      await client.teardown();
    }),
    { numRuns: 10, endOnFailure: true }
  );
});
