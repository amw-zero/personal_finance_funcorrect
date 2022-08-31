import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

const product =
  (...as: any) => as.reduce((product: any, curr: any) => product.flatMap((currP: any) => curr.map((e: any) => [currP, e].flat())));

type DateRange = {
  start: Date,
  end: Date,
};

type TestFrame = {
  dateRange: DateRange,
  recurringTransactions: CreateRecurringTransaction[],
};

function selectMiddleOfDayStart(input: TestFrame) {
  input.dateRange.start.setHours(12);
}

function selectEndOfDayStart(input: TestFrame) {
  input.dateRange.start.setHours(12);
}

function selectBeginningOfDayStart(input: TestFrame) {
  input.dateRange.start.setHours(2);
}

function startTimeOfDayCategory() {
  return [selectMiddleOfDayStart, selectEndOfDayStart, selectBeginningOfDayStart];
}

function selectMiddleOfDayEnd(input: TestFrame) {
  input.dateRange.end.setHours(12);
}

function selectEndOfDayEnd(input: TestFrame) {
  input.dateRange.end.setHours(12);
}

function selectBeginningOfDayEnd(input: TestFrame) {
  input.dateRange.end.setHours(2);
}

function endTimeOfDayCategory() {
  return [selectMiddleOfDayEnd, selectEndOfDayEnd, selectBeginningOfDayEnd];
}

function selectShortDuration(input: TestFrame) {
  input.dateRange.start.setMonth(1);
  input.dateRange.end.setMonth(2);
}

function selectMediumDuration(input: TestFrame) {
  input.dateRange.start.setMonth(3);
  input.dateRange.end.setMonth(6);
}

function selectLongDuration(input: TestFrame) {
  input.dateRange.start.setMonth(0);
  input.dateRange.end.setMonth(11);
}

function durationCategory() {
  return [selectShortDuration, selectMediumDuration, selectLongDuration];
}

function selectSomeMonthlyRule(input: TestFrame) {
  const rts: CreateRecurringTransaction[] = [
    { 
      name: "monthlyRt1", 
      amount: 10.00, 
      recurrenceRule: { recurrenceType: "monthly", day: 2 },
    }
  ];

  for (const rt of rts) {
    input.recurringTransactions.push(rt);
  }
}

function selectSomeWeeklyRule(input: TestFrame) {
  const rts: CreateRecurringTransaction[] = [
    { 
      name: "weeklyRt1", 
      amount: 10.00, 
      recurrenceRule: { recurrenceType: "weekly", day: 2, basis: new Date("2022-01-07"), interval: 4 },
    }
  ];

  for (const rt of rts) {
    input.recurringTransactions.push(rt);
  }
}

function selectSomeMixedRules(input: TestFrame) {
  const rts: CreateRecurringTransaction[] = [
    { 
      name: "monthlyRt2", 
      amount: 4.00, 
      recurrenceRule: { recurrenceType: "monthly", day: 19 },
    },
    { 
      name: "weeklyRt2", 
      amount: 1000.00, 
      recurrenceRule: { recurrenceType: "weekly", day: 2, basis: null, interval: null },
    }
  ];

  for (const rt of rts) {
    input.recurringTransactions.push(rt);
  }
}

function ruleTypeCategory() {
  return [selectSomeMonthlyRule, selectSomeWeeklyRule, selectSomeMixedRules];
}

type SelectionFunc = (i: TestFrame) => void;

const selectionCombinations: SelectionFunc[][] = product(
  startTimeOfDayCategory(),
  endTimeOfDayCategory(),
  durationCategory(),
  ruleTypeCategory(),
);

let testFrames: TestFrame[] = [];

console.log(`Generated ${selectionCombinations.length} test frames`);
for (const selectionCombination of selectionCombinations) {
  let startDate = new Date();
  let endDate = new Date();
  let recurringTransactions: CreateRecurringTransaction[] = [];

  let frame = { dateRange: { start: startDate, end: endDate }, recurringTransactions };
  for (const selection of selectionCombination) {
    selection(frame);
  }

  testFrames.push(frame);
}

Deno.test("Category-partition inputs plus model conformance property", async (t) => {
  let i = 0;
  for (const frame of testFrames) {
    let client = new Client();
    let budget = new Budget();

    await client.setup();
    await t.step(`Frame ${i}`, async (t) => {
      for (const crt of frame.recurringTransactions) {
        await client.addRecurringTransaction(crt);
        budget.addRecurringTransaction(crt);
      }

      await client.viewScheduledTransactions(frame.dateRange.start, frame.dateRange.end);
      budget.viewScheduledTransactions(frame.dateRange.start, frame.dateRange.end);

      assertEquals(client.scheduledTransactions, budget.scheduledTransactions);
    });
    i += 1;
    await client.teardown();
  }
});
