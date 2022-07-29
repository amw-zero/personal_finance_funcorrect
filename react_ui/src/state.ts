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

    type: "recurring_transaction"
}

interface RecurringTransactions {
    recurringTransactions: RecurringTransaction[];

    type: "recurring_transactions"
}

export interface CreateRecurringTransaction {
    name: string;
    amount: number;
    recurrenceRule: RecurrenceRule;
}

interface AppError {
    type: "app_error"
    message: string;
}

type RecurringTransactionResponse = RecurringTransaction | AppError
type RecurringTransactionsResponse = RecurringTransactions | AppError

export class Client {
    loading: boolean = false;
    error: string | null = null;
    recurringTransactions: RecurringTransaction[] = [];

    async addRecurringTransaction(rt: CreateRecurringTransaction) {
        this.loading = true;
        let resp = await fetch("http://localhost:3000/recurring_transactions", {
            method: "POST",
            body: JSON.stringify(rt),
            headers: {
                'Content-Type': "application/json",
            },
        });
        let json: RecurringTransactionResponse = await resp.json();
        this.loading = false;
        switch (json.type) {
        case "recurring_transaction":
            this.recurringTransactions.push(json);
            break;
        case "app_error":
            this.error = json.message;
            break;
        };
    }

    async viewRecurringTransactions() {
        this.loading = true;
        let resp = await fetch("http://localhost:3000/recurring_transactions");
        let json: RecurringTransactionsResponse = await resp.json();
        this.loading = false;

        switch (json.type) {
        case "recurring_transactions":
            this.recurringTransactions = json.recurringTransactions;
            break;
        case "app_error":
            this.error = json.message;
            break;
        };
    }
}