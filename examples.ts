
import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

Deno.test("Boundary dates when viewing scheduled transactions", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("December 14th example", async () => {
    let crt: CreateRecurringTransaction = { name: "test", amount: 50.0, recurrenceRule: { recurrenceType: "monthly", day: 14 }};
    model.addRecurringTransaction(crt);
    await client.addRecurringTransaction(crt);

    let startDate = new Date("Wed May 23 1990 02:15:24 GMT-0400");
    let endDate = new Date("Fri Dec 14 1990 02:17:00 GMT-0500");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});

Deno.test("Scheduled transaction failure", async (t) => {
  let model = new Budget();
  let client = new Client();

  let rts = [
    {
      "name": "%a>",
      "amount": 560804341,
      "recurrenceRule": {
        "recurrenceType": "weekly",
        "day": 3,
        "basis": "1990-03-03T14:23:48.519Z",
        "interval": 10
      }
    },
    {
      "name": "8)",
      "amount": 819819911,
      "recurrenceRule": {
        "recurrenceType": "weekly",
        "day": 20,
        "basis": null,
        "interval": 20
      }
    },
    {
      "name": "_4%83-ZE",
      "amount": -468921448,
      "recurrenceRule": {
        "recurrenceType": "monthly",
        "day": 3
      }
    },
    {
      "name": "7%wqcFv",
      "amount": -908963142,
      "recurrenceRule": {
        "recurrenceType": "monthly",
        "day": 28
      }
    },
    {
      "name": "r*a8#",
      "amount": 588348669,
      "recurrenceRule": {
        "recurrenceType": "weekly",
        "day": 3,
        "basis": "1990-07-13T07:53:29.602Z",
        "interval": 13
      }
    },
    {
      "name": "O]FnP'G)",
      "amount": 1790316722,
      "recurrenceRule": {
        "recurrenceType": "weekly",
        "day": 31,
        "basis": "1990-05-25T09:40:33.354Z",
        "interval": 3
      }
    }
  ];

  await client.setup();

  await t.step("December 14th example", async () => {
    rts.forEach(async rt => {
      model.addRecurringTransaction(rt);
      await client.addRecurringTransaction(rt);
    });
    
    let startDate = new Date("Sun Jun 03 1990 20:00:26 GMT-0400");
    let endDate = new Date("Fri Jul 13 1990 10:36:38 GMT-0400");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
})