// day of basis must equal day
export interface WeeklyRecurrence {
    recurrenceType: "weekly";
    interval: number;
    day: number;
    basis: Date;
}

// day must be valid month number
export type MonthlyRecurrence = {
    recurrenceType: "monthly";
    day: number;
}

export type RecurrenceRule = WeeklyRecurrence | MonthlyRecurrence

interface RecurringTransaction {
    id: number;
    name: string;
    amount: number;
    recurrenceRule: RecurrenceRule;
}

interface CreateRecurringTransaction {
    name: string;
    amount: number;
    recurrenceRule: RecurrenceRule;
}

interface ScheduledTransaction {
    date: Date;
    recurringTransaction: RecurringTransaction;
}

// Note: ids are part of the global state. Would need to
// set these to match any initial state in property-based test
let ids: Record<string, number> = {};

function genId(type: string): number {
    if (ids[type]) {
        ids[type] += 1;

        return ids[type];
    }

    ids[type] = 1;

    return 1;
}

// Naive algorithm: generate all dates in between 
// start and end. Filter out ones which do not meet
// recurrence rule
function expandRecurringTransaction(rt: RecurringTransaction, startDt: Date, endDt: Date) {
    let datesInRange: Date[] = [];
    let currDt = startDt;
    while (!datesEqual(currDt, endDt)) {
        datesInRange.push(currDt);

        // Advance by 1 day
        let date = currDt.getDate()
        currDt = new Date(currDt.getTime());
        currDt.setDate(date + 1);
    }

    return datesInRange.filter((d) => {
        switch (rt.recurrenceRule.recurrenceType) {
        case "monthly":
            return d.getDate() === rt.recurrenceRule.day;
        case "weekly":
            // TODO: Get basis week working
            return d.getDay() === rt.recurrenceRule.day;
        default:
            return false;
        }
    });
}

function datesEqual(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export class Budget {
    recurringTransactions: RecurringTransaction[] = [];

    addRecurringTransaction(crt: CreateRecurringTransaction) {
        this.recurringTransactions.push({ id: genId("RecurringTransaction"), ...crt });
    }

    viewRecurringTransactions(): RecurringTransaction[] {
        return this.recurringTransactions;
    }

    viewScheduledTransactions(start: Date, end: Date): ScheduledTransaction[][] {
        let expanded = this.recurringTransactions.map(rt => 
            expandRecurringTransaction(rt, start, end).map(d => (
                { date: d, recurringTransaction: rt }
            )));

        return expanded;
    }
}

/*
let b: Budget = new Budget();
b.addRecurringTransaction({
    name: "Rent", 
    amount: 1000, 
    recurrenceRule: { recurrenceType: "monthly", day: 1 }
});
b.addRecurringTransaction({
    name: "Student Loan", 
    amount: 500, 
    recurrenceRule: { recurrenceType: "monthly", day: 7 }
});
b.addRecurringTransaction({
    name: "Utilities", 
    amount: 200, 
    recurrenceRule: { recurrenceType: "weekly", interval: 2, day: 6, basis: new Date("01/01/2019") }
});

let startDt = new Date("08/1/2022");
let endDt = new Date("11/30/2022");

// console.log(b.viewScheduledTransactions(startDt, endDt));

let rule = b.recurringTransactions[2].recurrenceRule as WeeklyRecurrence;
console.log(rule.basis);
console.log(expandRecurringTransaction(b.recurringTransactions[2], startDt, endDt));
*/

// Next:
//   * Create React UI
//   * Create client side requests
//   * Create backend
//   * Create test that compares client connected to real backend to model. 