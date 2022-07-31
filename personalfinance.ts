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
    name: string;
    amount: number;
}

// Naive algorithm: generate all dates in between 
// start and end. Filter out ones which do not meet
// recurrence rule
function expandRecurringTransaction(rt: RecurringTransaction, startDt: Date, endDt: Date) {
    if (startDt >= endDt) {
        console.log(`expandRecurringTransaction: start date must be before end date, got start: ${startDt}, end: ${endDt}`);
        return [];
    }

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
    scheduledTransactions: ScheduledTransaction[] = [];

    // Note: ids are part of the global state. Would need to
    // set these to match any initial state in property-based test
    ids: Record<string, number> = {};

    genId(type: string): number {
        if (this.ids[type]) {
            this.ids[type] += 1;

            return this.ids[type];
        }

        this.ids[type] = 1;

        return 1;
    }

    addRecurringTransaction(crt: CreateRecurringTransaction) {
        this.recurringTransactions.push({ id: this.genId("RecurringTransaction"), ...crt });
    }

    viewRecurringTransactions(): RecurringTransaction[] {
        return this.recurringTransactions;
    }

    viewScheduledTransactions(start: Date, end: Date) {
        let expanded = this.recurringTransactions.flatMap(rt => 
            expandRecurringTransaction(rt, start, end).map(d => (
                { date: d, name: rt.name, amount: rt.amount }
            )));

        this.scheduledTransactions = expanded;
    }
}
