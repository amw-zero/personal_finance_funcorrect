import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

class AddRecurringTransactionCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly crt: CreateRecurringTransaction) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("[Action] addRecurringTransaction", this.crt);
    b.addRecurringTransaction(this.crt);
    await c.addRecurringTransaction(this.crt);
  }
  toString = () => `addRecurringTransaction`;
}

class ViewRecurringTransactionsCommand implements fc.AsyncCommand<Budget, Client> {
  constructor() {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("[Action] viewRecurringTransactions");

    b.viewRecurringTransactions();
    await c.viewRecurringTransactions();
  }
  toString = () => `viewRecurringTransactions`;
}

class ViewScheduledTransactionsCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly start: Date, readonly end: Date) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("[Action] viewScheduledTransactions", `start: ${this.start}, end: ${this.end}`);
    b.viewScheduledTransactions(this.start, this.end);
    await c.viewScheduledTransactions(this.start, this.end);
  }
  toString = () => `viewRecurringTransactions`;
}

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("2020-01-01T00:00:00.000Z");

Deno.test("functional correctness", async (t) => {
  let client = new Client();

  const allCommands = [
    fc.record({ name: fc.string(), amount: fc.integer() }).map(crt => new AddRecurringTransactionCommand({ ...crt, recurrenceRule: { recurrenceType: "monthly", day: 2 } })),
    fc.constant(new ViewRecurringTransactionsCommand()),
    fc.record({ 
      start: fc.date({min: dateMin, max: dateMax}),
      end: fc.date({min: dateMin, max: dateMax}), 
    }).map(({ start, end }) => new ViewScheduledTransactionsCommand(start, end)),
  ];

  await fc.assert(
    fc.asyncProperty(fc.commands(allCommands, { size: "small" }), async (cmds) => {
      console.log(`Checking scenario with ${cmds.commands.length} commands`);

      let model = new Budget();
      client = new Client();

      const env = () => ({ model, real: client });
      await fc.asyncModelRun(env, cmds);

      // Check invariants
      console.log("Checking invariants...");
      console.log({model, client});
      // UI state:

      assertEquals(client.loading, false);
      assertEquals(client.error, null);

      // Recurring Transactions
      assertEquals(model.recurringTransactions.length, client.recurringTransactions.length, `recurringTransactions have different lengths. model: ${model.recurringTransactions.length}, impl: ${client.recurringTransactions.length}`);

      for (let i = 0; i < model.recurringTransactions.length; i++) {
        let mrt = model.recurringTransactions[i];
        let crt = client.recurringTransactions[i];

        // Only checking for name and amount right now, recurrence rule isn't implemented in backend
        for (const prop in { name: mrt.name, amount: mrt.amount }) {
          assertEquals(mrt[prop], crt[prop], `Checking model val: ${mrt[prop]} | impl: ${crt[prop]}`);
        }
      }

      // Scheduled Transactions
      assertEquals(model.scheduledTransactions.length, client.scheduledTransactions.length, `scheduledTransactions have different lengths. model: ${model.scheduledTransactions.length}, impl: ${client.scheduledTransactions.length}`);

      for (let i = 0; i < model.scheduledTransactions.length; i++) {
        let mst = model.scheduledTransactions[i];
        let cst = client.scheduledTransactions[i];

        // Only checking for name and amount right now, recurrence rule isn't implemented in backend
        for (const prop in mst) {
          assertEquals(mst[prop], cst[prop], `Checking model val: ${mst[prop]} | impl: ${cst[prop]}`);
        }
      }
      console.log("\n\n")
    }).beforeEach(() => {
      return client.setup()
    }).afterEach(() => {
      return client.teardown();
    }),
    { numRuns: 100 }
  );
});
