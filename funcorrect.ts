import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

class AddRecurringTransactionCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly crt: CreateRecurringTransaction) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("[Action] addRecurringTransaction");
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
  toString = () => `viewScheduledTransactions`;
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
      await t.step(`Executing scenario with ${cmds.commands.length} commands`, async (t) => {
        let model = new Budget();
        client = new Client();
  
        const env = () => ({ model, real: client });
        await fc.asyncModelRun(env, cmds);
  
        await t.step("Checking invariants between model and implementation", async (t) => {
          await t.step("UI State", async () => {
            assertEquals(client.loading, false);
            assertEquals(client.error, null);
          });

          await t.step("Recurring transactions are equal", async () => {
            assertEquals(client.recurringTransactions, model.recurringTransactions, );
          });

          await t.step("Scheduled transactions are equal", async () => {
            assertEquals(client.scheduledTransactions, model.scheduledTransactions);
          });
        });
      });
      console.log("\n")
    }).beforeEach(() => {
      return client.setup()
    }).afterEach(() => {
      return client.teardown();
    }),
    { numRuns: 10 }
  );
});
