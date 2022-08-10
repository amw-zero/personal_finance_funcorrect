import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

Deno.test("Spec test - monthly on day", () => {
  let model = new Budget();
  model.addRecurringTransaction({
    name: "_4%83-ZE",
    amount: -468921448,
    recurrenceRule: {
      recurrenceType: "monthly",
      day: 3
    }
  });

  let startDate = new Date("Sun Jun 03 1990 20:00:26 GMT-0400");
  let endDate = new Date("Fri Jul 13 1990 10:36:38 GMT-0400");

  model.viewScheduledTransactions(startDate, endDate);

  let expectedScheduledTransactions = [
    {
      amount: -468921448,
      date: "06/03/1990",
      name: "_4%83-ZE",
    },
    {
      amount: -468921448,
      date: "07/03/1990",
      name: "_4%83-ZE",
    },
  ];

  console.log({modelSts: model.scheduledTransactions});
  assertEquals(expectedScheduledTransactions, model.scheduledTransactions);
});

Deno.test("Spec test - adding recurring transaction date normalization", () => {
  let model = new Budget();
  model.addRecurringTransaction({
    name: "%9",
    amount: -1769943191,
    recurrenceRule: {
      recurrenceType: "weekly",
      day: 19,

      basis: new Date("1990-01-08T02:09:18.877Z"),
      interval: 33
    }
  });

  console.log({modelSts: model.recurringTransactions});
 
  // This is assuming that the test is being run on a machine in the Eastern Timezone.
  // It's the previous day because of the timezone offset (UTC - 4 or UTC - 5). The
  // idea is that input dates are intended to come from a date picker in the user's browser,
  // and will be returning dates in the local time of the user. So it's the local time
  // that we should be respecting, not whatever timezone format the acual date is in.
  assertEquals("01/07/1990", model.recurringTransactions[0].recurrenceRule.basis);
});

Deno.test("Date normalization in Client", async () => {
  let client = new Client();
  await client.addRecurringTransaction({
    "name": "P+L|t<$L",
    "amount": -2003880079,
    "recurrenceRule": {
      "recurrenceType": "weekly",
      "day": 30,
      "basis": new Date("1990-03-07T00:51:55.594Z"),
      "interval": 53
    }
  });

  console.log({clientSts: client.recurringTransactions});
 
  // This is assuming that the test is being run on a machine in the Eastern Timezone.
  // It's the previous day because of the timezone offset (UTC - 4 or UTC - 5). The
  // idea is that input dates are intended to come from a date picker in the user's browser,
  // and will be returning dates in the local time of the user. So it's the local time
  // that we should be respecting, not whatever timezone format the acual date is in.
  assertEquals("03/06/1990", client.recurringTransactions[0].recurrenceRule.basis);
});

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
      name: "_4%83-ZE",
      amount: -468921448,
      recurrenceRule: {
        recurrenceType: "monthly",
        day: 3
      }
    },
    {
      name: "7%wqcFv",
      amount: -908963142,
      recurrenceRule: {
        recurrenceType: "monthly",
        day: 28
      }
    },
  ];

  await client.setup();

  await t.step("", async () => {
    for (const rt of rts) {
      model.addRecurringTransaction(rt);
      await client.addRecurringTransaction(rt);
    }
    
    let startDate = new Date("Sun Jun 03 1990 20:00:26 GMT-0400");
    let endDate = new Date("Fri Jul 13 1990 10:36:38 GMT-0400");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});

Deno.test("Weekly recurrence with interval and basis", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("failure case", async () => {
    let crt: CreateRecurringTransaction = {
      name: "test",
      amount: -100125213,
      recurrenceRule: {
        recurrenceType: "weekly",
        day: 17,
        basis: new Date("1990-01-23T09:21:26.382Z"),
        interval: 13
      }
    };

    model.addRecurringTransaction(crt);
    await client.addRecurringTransaction(crt);

    let startDate = new Date("Wed Jun 27 1990 17:45:09 GMT-0400");
    let endDate = new Date("Thu Dec 20 1990 14:01:44 GMT-0500");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});

Deno.test("Weekly recurrence with interval and basis and scheduled transactions on timezone boundary", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("failure case", async () => {
    let crt: CreateRecurringTransaction = {
      name: " qB)[md5",
      amount: 1333232573,
      recurrenceRule: {
        recurrenceType: "weekly",
        day: 0,
        basis: new Date("1990-02-16T14:28:53.386Z"),
        interval: 2
      }
    };

    model.addRecurringTransaction(crt);
    await client.addRecurringTransaction(crt);

    let startDate = new Date("Mon Mar 1 1990 20:15:59 GMT-0500");
    let endDate = new Date("Sun Mar 4 1990 13:30:21 GMT-0400");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});

Deno.test("Multiple recurring transactions that map to scheduled transactions on the same day", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("they should have a secondary sort on name", async () => {
    let rts = [
      {
        name: "B",
        amount: 1202177524,
        recurrenceRule: {
          recurrenceType: "monthly",
          day: 28
        }
      },
      {
        name: "A",
        amount: -1531327368,
        recurrenceRule: {
          recurrenceType: "monthly",
          day: 28
        }
      }
    ];

    for (const rt of rts) {
      model.addRecurringTransaction(rt);
      await client.addRecurringTransaction(rt);
    }

    let startDate = new Date("Thu Mar 27 1990 22:51:24 GMT-0500");
    let endDate = new Date("Fri Mar 29 1990 04:42:13 GMT-0500");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});

Deno.test("Expanding scheduled transactions across daylight savings time", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("they should all be correct", async () => {
    let rt = {
      "name": "0|EYHD",
      "amount": 2055893031,
      "recurrenceRule": {
        "recurrenceType": "weekly",
        "day": 14,
        "basis": new Date("1990-02-19T01:54:02.891Z"),
        "interval": 14
      }
    }

    model.addRecurringTransaction(rt);
    await client.addRecurringTransaction(rt);

    let startDate = new Date("Tue Feb 13 1990 00:29:21 GMT-0500");
    let endDate = new Date("Mon Sep 10 1990 15:09:01 GMT-0400");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});

Deno.test("Schedule transaction boundary dates", async (t) => {
  let model = new Budget();
  let client = new Client();

  await client.setup();

  await t.step("they should all be correct", async () => {
    let rt = {
      "name": "",
      "amount": -1506620084,
      "recurrenceRule": {
        "recurrenceType": "weekly",
        "day": 27,
        "basis": "1990-11-11T19:22:51.755Z",
        "interval": 6
      }
    };

    model.addRecurringTransaction(rt);
    await client.addRecurringTransaction(rt);

    let startDate = new Date("Wed May 09 1990 15:33:36 GMT-0400");
    let endDate = new Date("Mon Aug 20 1990 22:36:55 GMT-0400");

    model.viewScheduledTransactions(startDate, endDate);
    await client.viewScheduledTransactions(startDate, endDate);

    console.log({clientSts: client.scheduledTransactions, modelSts: model.scheduledTransactions});

    assertEquals(client.scheduledTransactions, model.scheduledTransactions);
  });

  await client.teardown();
});
