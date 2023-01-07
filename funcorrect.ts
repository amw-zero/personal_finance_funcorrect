import { Client, CreateRecurringTransaction, EditRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

class AddRecurringTransactionCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly crt: CreateRecurringTransaction) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("  [Action] addRecurringTransaction");
    console.group();
    console.log(JSON.stringify(this.crt, null, 2));
    console.groupEnd();

    b.addRecurringTransaction(this.crt);
    await c.addRecurringTransaction(this.crt);
  }
  toString = () => `addRecurringTransaction`;
}

class EditRecurringTransactionCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly ert: EditRecurringTransaction) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("  [Action] editRecurringTransaction");
    console.group();
    console.log(JSON.stringify(this.ert, null, 2));
    console.groupEnd();

    b.editRecurringTransaction(this.ert);
    await c.editRecurringTransaction(this.ert);
  }
  toString = () => `editRecurringTransaction`;
}

class DeleteRecurringTransactionCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly id: number) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("  [Action] editRecurringTransaction");
    console.group();
    console.log(this.id);
    console.groupEnd();

    b.deleteRecurringTransaction(this.id);
    await c.deleteRecurringTransaction(this.id);
  }
  toString = () => `editRecurringTransaction`;
}

class ViewRecurringTransactionsCommand implements fc.AsyncCommand<Budget, Client> {
  constructor() {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("  [Action] viewRecurringTransactions");

    b.viewRecurringTransactions();
    await c.viewRecurringTransactions();
  }
  toString = () => `viewRecurringTransactions`;
}

class ViewScheduledTransactionsCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly start: Date, readonly end: Date) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("  [Action] viewScheduledTransactions", `start: ${this.start}, end: ${this.end}`);

    b.viewScheduledTransactions(this.start, this.end);
    await c.viewScheduledTransactions(this.start, this.end);
  }
  toString = () => `viewScheduledTransactions`;
}

const dateMin = new Date("1990-01-01T00:00:00.000Z");
const dateMax = new Date("1991-01-01T00:00:00.000Z");

Deno.test("functional correctness", async (t) => {
  let client = new Client();

  const allCommands = [
    fc.record({ 
      name: fc.string(), 
      amount: fc.integer(), 
      recurrenceRule: fc.oneof(
        fc.record({ recurrenceType: fc.constant("monthly"), day: fc.integer({min: 0, max: 31}) }),
        fc.record({ 
          recurrenceType: fc.constant("weekly"), 
          day: fc.integer({min: 0, max: 31 }), 
          basis: fc.option(fc.date({min: dateMin, max: dateMax})),
          interval: fc.option(fc.integer({min: 1, max: 60})) 
        })
      ) 
    }).map(crt => new AddRecurringTransactionCommand(crt)),
    // Edit both existing and non-existing records
    fc.constant(new ViewRecurringTransactionsCommand()),
    fc.record({ 
      start: fc.date({min: dateMin, max: dateMax}),
      end: fc.date({min: dateMin, max: dateMax}), 
    }).map(({ start, end }) => new ViewScheduledTransactionsCommand(start, end)),
    fc.record({ 
      id: fc.integer({ min: 1, max: 10 }),
      name: fc.string(), 
      amount: fc.integer(), 
      recurrenceRule: fc.oneof(
        fc.record({ recurrenceType: fc.constant("monthly"), day: fc.integer({min: 0, max: 31}) }),
        fc.record({ 
          recurrenceType: fc.constant("weekly"), 
          day: fc.integer({min: 0, max: 31 }), 
          basis: fc.option(fc.date({min: dateMin, max: dateMax})),
          interval: fc.option(fc.integer({min: 1, max: 60})) 
        })
      ),
    }).map(ert => new EditRecurringTransactionCommand(ert)),
    fc.record({ 
      id: fc.integer({ min: 1, max: 10 }),
    }).map(ert => new DeleteRecurringTransactionCommand(ert))
  ];

  await fc.assert(
    fc.asyncProperty(fc.commands(allCommands, { size: "small" }), async (cmds) => {
      await client.setup();

      await t.step(`Executing scenario with ${cmds.commands.length} commands`, async (t) => {
        let model = new Budget();
        client = new Client();
  
        const env = () => ({ model, real: client });
        await fc.asyncModelRun(env, cmds);
  
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
      });
      console.log("\n")
    }),
    { numRuns: 100 }
  );
});
