// Section -- Core data model

type DateString = string;

function dateStringFromDate(d: Date): DateString {
  let month = (d.getMonth() + 1).toString().padStart(2, "0");
  let day = d.getDate().toString().padStart(2, "0");
  let year = d.getFullYear().toString();

  return `${month}/${day}/${year}`;
}

export interface WeeklyRecurrence {
  recurrenceType: "weekly";
  interval: number | null;
  day: number;
  basis: DateString | null;
}

export type MonthlyRecurrence = {
    recurrenceType: "monthly";
    day: number;
}

export type RecurrenceRule = WeeklyRecurrence | MonthlyRecurrence;

interface RecurringTransaction {
  id: number;
  name: string;
  amount: number;
  recurrenceRule: RecurrenceRule;
}

interface ScheduledTransaction {
  date: string;
  name: string;
  amount: number;
}

// Section -- UI Interface

export interface CreateWeeklyRecurrence {
  recurrenceType: "weekly";
  interval: number | null;
  day: number;
  basis: Date | null;
}

export type CreateMonthlyRecurrence = {
  recurrenceType: "monthly";
  day: number;
}

export type CreateRecurrenceRule = CreateWeeklyRecurrence | CreateMonthlyRecurrence;

interface CreateRecurringTransaction {
  name: string;
  amount: number;
  recurrenceRule: CreateRecurrenceRule;
}

function recurringTransactionFromCreate(id: number, crt: CreateRecurringTransaction): RecurringTransaction {
  switch (crt.recurrenceRule.recurrenceType) {
  case "weekly":
    let basis: DateString | null = null;
    if (crt.recurrenceRule.basis) {
      basis = dateStringFromDate(crt.recurrenceRule.basis);
    }
      
    return { id, ...crt, recurrenceRule: { ...crt.recurrenceRule, basis } }
  case "monthly":
    return { id, ...crt, recurrenceRule: crt.recurrenceRule };
  }
}

// Section -- Recurrence rule expansion

function timeWithTzOffset(d: Date): number {
  return d.getTime() - d.getTimezoneOffset() * 60 * 1000;
}

const ONE_DAY = 1000 * 60 * 60 * 24

function doesWeeklyRuleApply(d: Date, rule: WeeklyRecurrence): boolean {    
  if (rule.interval && rule.basis) {
    let basisDate = new Date(rule.basis);
    let dayDelta = Math.floor(
      (timeWithTzOffset(d) - timeWithTzOffset(basisDate)) / ONE_DAY
    );

    return (dayDelta / 7.0) % rule.interval == 0;
  }

  if (rule.interval || rule.basis) {
    return false;
  }

  return d.getDay() === rule.day;
}

// Simple algorithm: generate all dates in between start and end. 
// Filter out ones which do not satisfy the recurrence rule.
function expandRecurringTransaction(rt: RecurringTransaction, startDt: Date, endDt: Date) {
  if (startDt >= endDt) {
    console.log(`expandRecurringTransaction: start date must be before end date, got start: ${startDt}, end: ${endDt}`);
    return [];
  }

  let normalizedStart = new Date(dateStringFromDate(startDt));
  let normalizedEnd = new Date(dateStringFromDate(endDt));

  let datesInRange: Date[] = [];
  let currDt = normalizedStart;
  while (currDt <= normalizedEnd) { 
    datesInRange.push(currDt);

    // Advance by 1 day
    let date = currDt.getDate();
    currDt = new Date(currDt);
    currDt.setDate(date + 1);
  }

  return datesInRange.filter((d) => {
    switch (rt.recurrenceRule.recurrenceType) {
    case "monthly":
        return d.getDate() === rt.recurrenceRule.day;
    case "weekly":
        return doesWeeklyRuleApply(d, rt.recurrenceRule);
    default:
        return false;
    }
  });
}

// Section -- Application model

function compareScheduledTransactions(st1: ScheduledTransaction, st2: ScheduledTransaction): number {
  if (st2.date > st1.date) {
    return -1;
  } else if (st2.date < st1.date) {
    return 1;
  } else {
    return st1.name.localeCompare(st2.name);
  }
}

export class Budget {
  recurringTransactions: RecurringTransaction[] = [];
  scheduledTransactions: ScheduledTransaction[] = [];
  error: string | null = null;

  ids: Record<string, number> = {};

  addRecurringTransaction(crt: CreateRecurringTransaction) {
    this.recurringTransactions.push(recurringTransactionFromCreate(this.genId("RecurringTransaction"), crt));
  }

  viewRecurringTransactions(): RecurringTransaction[] {
    return this.recurringTransactions;
  }

  viewScheduledTransactions(start: Date, end: Date) {
    let expanded = this.recurringTransactions.flatMap(rt =>
      expandRecurringTransaction(rt, start, end).map(d => (
        { date: dateStringFromDate(d), name: rt.name, amount: rt.amount }
      )));

    expanded.sort(compareScheduledTransactions);

    this.scheduledTransactions = expanded;
  }

  genId(type: string): number {
    if (this.ids[type]) {
      this.ids[type] += 1;

      return this.ids[type];
    }

    this.ids[type] = 1;

    return 1;
  }
}
