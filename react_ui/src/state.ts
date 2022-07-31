// State binding for application kernel

// Property: for all transitions, the state bound in the React UI matches the 
// plain object state

interface WeeklyRecurrence {
    recurrenceType: "weekly";
    interval: number;
    day: number;
    basis: Date;
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

    type: "recurring_transaction";
}

interface RecurringTransactions {
    recurring_transactions: RecurringTransaction[];

    type: "recurring_transactions";
}

export interface CreateRecurringTransaction {
    name: string;
    amount: number;
    recurrenceRule: RecurrenceRule;
}

interface ScheduledTransaction {
    date: Date;
    recurringTransaction: RecurringTransaction;
}

interface ScheduledTransactions {
    scheduled_transactions: ScheduledTransaction[];

    type: "scheduled_transactions";
}

interface AppError {
    type: "error"
    message: string;
}

type RecurringTransactionResponse = RecurringTransaction | AppError
type RecurringTransactionsResponse = RecurringTransactions | AppError
type ScheduledTransactionsResponse = ScheduledTransactions | AppError

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
            this.recurringTransactions.push(json);
            break;
        case "error":
            this.error = json.message;
            break;
        default:
            console.log("Default")
        };
    }

    // add_recur_trans(AppState, CreateRecurringTransaction, ClientState)
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
            this.recurringTransactions = json.recurring_transactions;
            break;
        case "error":
            this.error = json.message;
            break;
        default:
            console.log("Default")
        };
    }

    updateLoading(l: boolean) {
        this.loading = l;
    }

    async viewRecurringTransactions() {
        this.updateLoading(true);
        console.log("Fetching rts");
        let resp = await fetch("http://localhost:3000/recurring_transactions");
        
        this.updateRecurringTransactions(await resp.json());
    }

    async viewScheduledTransactions(start: Date, end: Date) {
        this.loading = true;
        let resp = await fetch(`http://localhost:3000/scheduled_transactions?start_date=${start.toISOString()}&end_date=${end.toISOString()}`);
        let json: ScheduledTransactionsResponse = await resp.json();
        console.log({sched_transaction_resp: json});
        this.loading = false;

        switch (json.type) {
        case "scheduled_transactions":
            this.scheduledTransactions = json.scheduled_transactions;
            break;
        case "error":
            this.error = json.message;
            break;
        };
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