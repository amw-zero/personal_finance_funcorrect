import { Client, CreateRecurringTransaction } from './react_ui/src/state.ts';
import { Budget, ScheduledTransaction } from "./personalfinance.ts"

import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

import "https://deno.land/x/lodash@4.17.19/lodash.js";

const _ = (self as any)._;

function product<T>(...args: T[][]): T[][] {
  return _.reduce(args, function(a: T[][], b: T[]) {
    return _.flatten(_.map(a, function(x: T[]) {
      return _.map(b, function(y: T) {
        return x.concat([y]);
      });
    }), true);
  }, [ [] ]);
}

// function productD(...args: any[]) {
//   return _.reduce(args, function(a: any, b: any) {
//     return _.flatten(_.map(a, function(x: any) {
//       return _.map(b, function(y: any) {
//         return x.concat([y]);
//       });
//     }), true);
//   }, [ [] ]);
// }

const productD =
  (...as: any) => as.reduce((product: any, curr: any) => product.flatMap((currP: any) => curr.map((e: any) => [currP, e].flat())));

function categoryElement(n: number): number {
  return n + 1
}

function categoryElement2(n: number): number {
  return n + 2;
}

// function process<T>(testFrames: T[][]) {
//   for(const frame of testFrames) {
//     let value: T;
//     frame.forEach(ce => {
//       value = ce(value)
//     });
//   }
// }

// const testData = process(testFrames);

type DateRange = {
  start: Date,
  end: Date,
}

type Input = {
  dateRange: DateRange,
  recurringTransactions: CreateRecurringTransaction[],
}

function selectMiddleOfDayStart(input: Input) {
  input.dateRange.start.setHours(12);
}

function selectEndOfDayStart(input: Input) {
  input.dateRange.start.setHours(12);
}

function selectBeginningOfDayStart(input: Input) {
  input.dateRange.start.setHours(2);
}

function startTimeOfDayCategory() {
  return [selectMiddleOfDayStart, selectEndOfDayStart, selectBeginningOfDayStart];
}

function selectMiddleOfDayEnd(input: Input) {
  input.dateRange.end.setHours(12);
}

function selectEndOfDayEnd(input: Input) {
  input.dateRange.end.setHours(12);
}

function selectBeginningOfDayEnd(input: Input) {
  input.dateRange.end.setHours(2);
}

function endTimeOfDayCategory() {
  return [selectMiddleOfDayEnd, selectEndOfDayEnd, selectBeginningOfDayEnd];
}

function selectShortDuration(input: Input) {
  input.dateRange.start.setMonth(1);
  input.dateRange.end.setMonth(2);
}

function selectMediumDuration(input: Input) {
  input.dateRange.start.setMonth(3);
  input.dateRange.end.setMonth(6);
}

function selectLongDuration(input: Input) {
  input.dateRange.start.setMonth(0);
  input.dateRange.end.setMonth(11);
}

function durationCategory() {
  return [selectShortDuration, selectMediumDuration, selectLongDuration] 
}

function selectSomeMonthlyRule(input: Input) {
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

function selectSomeWeeklyRule(input: Input) {
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

function selectSomeMixedRules(input: Input) {
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

// Test view scheduled transactions
// Input: start date, end date, recurring transactions
//
// Date range:
//   start time: f(startDate)
//     middle of day
//     end of day        (go to next day in UTC)
//     beginning of day  (to to previous day in UTC)
// 
//   end time: f(endDate)
//     middle of day
//     end of day        (go to next day in UTC)
//     beginning of day  (to to previous day in UTC)
//
//   order:
//     end before start
//     start before end
//
//   duration:
//     short   (1 month)
//     medium  (4 months)
//     long    (8 months)
//
// Recurring transactions: () => RecurringTransaction[]
//   rule type:
//     all monthly
//     all weekly
//     mixed types
//     one of (RecurrenceRule.type)
//
//   timezone relation:
//     same
//     different
//   
//   times:
//     some middle of day
//     some end of day
//     some beginning of day
//  
//   date range relation: (depends on date range being selected)
//     beginning of range
//     middle of range
//     end of range
//     
//   

// Example frame:
//   date range:
//     Timezone: UTC
//     time: end of day
//     order: start before end
//     duration: medium
//   recurring transactions:
//     rule type: mixed types
//     timezone relation: same
//     times: some beginning of day
//     date range relation: end of ange
// 
//     
//   
//  startDate = 1990-9-10T23:22:51.755Z, endDate = 1990-11-11T23:22:51.755Z,
//  recurringTransactions = [
//    {
//     
//    }
//  ]

// Should be polymorphic in Input type, i.e. productD<Input>, and [[(i: Input) => void]],
// i.e. each element of the category arrays should take in the Input type
const testFrameGenerators = productD(
  startTimeOfDayCategory(),
  endTimeOfDayCategory(),
  durationCategory(),
  ruleTypeCategory(),
);

let testFrames: Input[] = [];

console.log(`Generated ${testFrameGenerators.length} test frames`);
for (const frame of testFrameGenerators) {
  let startDate = new Date();
  let endDate = new Date();
  let recurringTransactions: CreateRecurringTransaction[] = [];

  let input = { dateRange: { start: startDate, end: endDate }, recurringTransactions };
  for (const selection of frame) {
    selection(input);
  }

  testFrames.push(input);
}

Deno.test("Category-partition inputs", async (t) => {
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
