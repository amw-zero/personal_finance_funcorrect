// State binding for application kernel

// Property: for all transitions, the state bound in the React UI matches the 
// plain object state

interface WeeklyRecurrence {
    recurrenceType: "weekly";
    interval: number;
    day: number;
    basis: Date | null;
}

// day must be valid month number
type MonthlyRecurrence = {
    recurrenceType: "monthly";
    day: number;
}

type RecurrenceRule = WeeklyRecurrence | MonthlyRecurrence

interface RecurringTransaction {
    id: number;
    name: string;
    amount: number;
    recurrenceRule: RecurrenceRule;
}


// day must be valid month number
type MonthlyRecurrenceJson = {
    recurrence_type: "monthly";
    day: number;
}

interface WeeklyRecurrenceJson {
    recurrence_type: "weekly";
    interval: number;
    day: number;
    basis: Date;
}

type RecurrenceRuleJson = WeeklyRecurrenceJson | MonthlyRecurrenceJson

interface RecurringTransactionJson {
    id: number;
    name: string;
    amount: number;
    recurrence_rule: RecurrenceRuleJson;

    type: "recurring_transaction";
}

interface RecurringTransactions {
    recurring_transactions: RecurringTransactionJson[];

    type: "recurring_transactions";
}

export interface CreateRecurringTransaction {
    name: string;
    amount: number;
    recurrenceRule: RecurrenceRule;
}

interface ScheduledTransaction {
    date: Date;
    name: string;
    amount: number;
}

interface ScheduledTransactions {
    scheduled_transactions: ScheduledTransaction[];

    type: "scheduled_transactions";
}

interface AppError {
    type: "error"
    message: string;
}

type RecurringTransactionResponse = RecurringTransactionJson | AppError
type RecurringTransactionsResponse = RecurringTransactions | AppError
type ScheduledTransactionsResponse = ScheduledTransactions | AppError

function normalizeRecurrenceRule(json: RecurrenceRuleJson): RecurrenceRule {    
    switch (json.recurrence_type) {
    case "monthly": return { recurrenceType: "monthly", day: json.day };
    case "weekly": 
        let basis: Date | null = null;
        if (json.basis) {
            basis = new Date(json.basis);
        }
        return { recurrenceType: "weekly", day: json.day, basis, interval: json.interval }
    }
}

function normalizeRecurringTransaction(json: RecurringTransactionJson): RecurringTransaction {
    return {
        id: json.id,
        name: json.name,
        amount: json.amount,
        recurrenceRule: normalizeRecurrenceRule(json.recurrence_rule)
    }
}

export class Client {
    loading: boolean = false;
    error: string | null = null;

    recurringTransactions: RecurringTransaction[] = [];
    scheduledTransactions: ScheduledTransaction[] = [];

    constructor(config: (c: Client) => void = () => {}) {
        config(this);
    }

    updateNewRecurringTransaction(json: RecurringTransactionResponse) {
        this.loading = false;
        switch (json.type) {
        case "recurring_transaction":
            this.recurringTransactions.push(normalizeRecurringTransaction(json));
            break;
        case "error":
            this.error = json.message;
            break;
        default:
            console.log("Default was hit when updating new recurring transaction")
        };
    }

    async addRecurringTransaction(rt: CreateRecurringTransaction) {
        this.updateLoading(true);
        let body: any = { ...rt, recurrence_rule: rt.recurrenceRule }
        delete body.recurrenceRule;

        let resp = await fetch("http://localhost:3000/recurring_transactions", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Content-Type': "application/json",
            },
        });
 
        this.updateNewRecurringTransaction(await resp.json());
    }

    // State updates are in a sync function, for Mobx
    updateRecurringTransactions(json: RecurringTransactionsResponse) {
        this.loading = false;

        switch (json.type) {
        case "recurring_transactions":
            this.recurringTransactions = json.recurring_transactions.map(normalizeRecurringTransaction);
            break;
        case "error":
            this.error = json.message;
            break;
        default:
            console.log("Default was hit when updating recurring transactions")
        };
    }

    updateLoading(l: boolean) {
        this.loading = l;
    }

    async viewRecurringTransactions() {
        this.updateLoading(true);
        let resp = await fetch("http://localhost:3000/recurring_transactions");
        
        this.updateRecurringTransactions(await resp.json());
    }

    updateScheduledTransactions(json: ScheduledTransactionsResponse) {
        this.updateLoading(false);
        switch (json.type) {
            case "scheduled_transactions":
                this.scheduledTransactions = json.scheduled_transactions;
                break;
            case "error":
                this.error = json.message;
                break;
            };
    }

    async viewScheduledTransactions(start: Date, end: Date) {
        this.updateLoading(true);
        let resp = await fetch(`http://localhost:3000/scheduled_transactions?start_date=${start.toUTCString()}&end_date=${end.toUTCString()}`);

        this.updateScheduledTransactions(await resp.json());
    }

    async setup() {
        return fetch("http://localhost:3000/setup", {
            method: "POST",
        });
    }

    async teardown() {
        return fetch("http://localhost:3000/teardown", {
            method: "POST",
        });
    }
}