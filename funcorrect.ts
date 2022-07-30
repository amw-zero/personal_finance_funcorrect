import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import fc from 'https://cdn.skypack.dev/fast-check';

class AddRecurringTransactionCommand implements fc.Command<Budget, Client> {
  constructor(readonly crt: CreateRecurringTransaction) {}
  check = (m: Readonly<Budget>) => true;
  async run(b: Budget, c: Client): Promise<void> {
    b.addRecurringTransaction(this.crt);
    await c.addRecurringTransaction(this.crt);
  }
  toString = () => `addRecurringTransaction(${this.crt})`;
}

Deno.test("functional correctness", async (t) => {
  let client = new Client();
  const allCommands = [
    fc.record({ name: fc.string(), amount: fc.integer() }).map(crt => new AddRecurringTransactionCommand({ ...crt, recurrenceRule: { recurrenceType: "monthly", day: 2 } }))
  ];

  await fc.assert(
    fc.asyncProperty(fc.commands(allCommands), async (cmds) => {
      let model = new Budget();
      client = new Client();

      const env = () => ({ model, real: client });
      return fc.asyncModelRun(env, cmds);
    }).beforeEach(() => {
      return client.setup()
    }).afterEach(() => {
      return client.teardown();
    })
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
