import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

class AddRecurringTransactionCommand implements fc.AsyncCommand<Budget, Client> {
  constructor(readonly crt: CreateRecurringTransaction) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("Creating rt");
    b.addRecurringTransaction(this.crt);
    await c.addRecurringTransaction(this.crt);
  }
  toString = () => `addRecurringTransaction`;
}

class ViewRecurringTransactionsCommand implements fc.AsyncCommand<Budget, Client> {
  constructor() {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    console.log("viewRecurringTransactions");

    b.viewRecurringTransactions();
    await c.viewRecurringTransactions();
  }
  toString = () => `viewRecurringTransactions`;
}

Deno.test("functional correctness", async (t) => {
  let client = new Client();

  const allCommands = [
    fc.record({ name: fc.string(), amount: fc.integer() }).map(crt => new AddRecurringTransactionCommand({ ...crt, recurrenceRule: { recurrenceType: "monthly", day: 2 } })),
    fc.constant(new ViewRecurringTransactionsCommand())
  ];

  await fc.assert(
    fc.asyncProperty(fc.commands(allCommands, { size: "medium" }), async (cmds) => {
      console.log(`Checking scenario with ${cmds.commands.length} commands`);

      let model = new Budget();
      client = new Client();

      const env = () => ({ model, real: client });
      await fc.asyncModelRun(env, cmds);

      // Check invariants
      console.log("Checking invariants...");
      //console.log({model: model.recurringTransactions, client: client.recurringTransactions});
      assertEquals(model.recurringTransactions.length, client.recurringTransactions.length);

      for (let i = 0; i < model.recurringTransactions.length; i++) {
        let mrt = model.recurringTransactions[i];
        let crt = client.recurringTransactions[i];

        // Only checking for name and amount right now, recurrence rule isn't implemented in backend
        for (const prop in { name: mrt.name, amount: mrt.amount }) {
          assertEquals(mrt[prop], crt[prop], `Checking model val: ${mrt[prop]} | impl: ${crt[prop]}`);
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

  // await fc.assert(fc.asyncProperty(fc.string(), async (text: string) => {
  //   let model = new Budget();
  //   client = new Client();
    
  //   let rt: CreateRecurringTransaction = { name: "idk", amount: 15.0, recurrenceRule: { recurrenceType: "monthly", day: 2 } };

  //   model.addRecurringTransaction(rt);
  //   model.viewRecurringTransactions()

  //   await client.addRecurringTransaction(rt);
  //   await client.viewRecurringTransactions()

  //   return true;
  // }).beforeEach(() => {
  //   return client.setup()
  // }).afterEach(() => {
  //   return client.teardown();
  // }));
});
