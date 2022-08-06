export interface WeeklyRecurrence {
    recurrenceType: "weekly";
    interval: number;
    day: number;
    basis: Date;
}

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
    date: string;
    name: string;
    amount: number;
}

// Simple algorithm: generate all dates in between 
// start and end. Filter out ones which do not satisfy
// the recurrence rule.
function expandRecurringTransaction(rt: RecurringTransaction, startDt: Date, endDt: Date) {
    if (startDt >= endDt) {
        console.log(`expandRecurringTransaction: start date must be before end date, got start: ${startDt}, end: ${endDt}`);
        return [];
    }

    let datesInRange: Date[] = [];
    let currDt = startDt;
    while (currDt < endDt) {
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

function formatDate(d: Date): string {
    return d.toLocaleDateString("en-us", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export class Budget {
    recurringTransactions: RecurringTransaction[] = [];
    scheduledTransactions: ScheduledTransaction[] = [];
    error: string | null = null;

    ids: Record<string, number> = {};

    addRecurringTransaction(crt: CreateRecurringTransaction) {
        this.recurringTransactions.push({ id: this.genId("RecurringTransaction"), ...crt });
    }

    viewRecurringTransactions(): RecurringTransaction[] {
        return this.recurringTransactions;
    }

    viewScheduledTransactions(start: Date, end: Date) {
        let expanded = this.recurringTransactions.flatMap(rt => 
            expandRecurringTransaction(rt, start, end).map(d => (
                { date: formatDate(d), name: rt.name, amount: rt.amount }
            )));
        
        expanded.sort((d1, d2) => {
            if (d2.date > d1.date) {
                return -1;
            } else if (d2.date < d1.date) {
                return 1;
            } else {
                return 0;
            }
        });

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
