type DateString = string;

interface WeeklyRecurrence {
    recurrenceType: "weekly";
    interval: number | null;
    day: number;
    basis: DateString | null;
}

type MonthlyRecurrence = {
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

type MonthlyRecurrenceJson = {
    recurrence_type: "monthly";
    day: number;
}

interface WeeklyRecurrenceJson {
    recurrence_type: "weekly";
    interval: number | null;
    day: number;
    basis: DateString | null;
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

export interface CreateRecurringTransaction {
    name: string;
    amount: number;
    recurrenceRule: CreateRecurrenceRule;
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

const API_HOST = "http://localhost:3000";

function normalizeRecurrenceRuleJson(json: RecurrenceRuleJson): RecurrenceRule {    
    switch (json.recurrence_type) {
    case "monthly": return { recurrenceType: "monthly", day: json.day };
    case "weekly": 
        return { recurrenceType: "weekly", day: json.day, basis: json.basis, interval: json.interval }
    }
}

function normalizeRecurringTransaction(json: RecurringTransactionJson): RecurringTransaction {
    return {
        id: json.id,
        name: json.name,
        amount: json.amount,
        recurrenceRule: normalizeRecurrenceRuleJson(json.recurrence_rule)
    }
}

function serializeDate(d: Date): string {
    let month = (d.getMonth() + 1).toString().padStart(2, "0");
    let day = d.getDate().toString().padStart(2, "0");
    let year = d.getFullYear().toString();
    return `${year}-${month}-${day}`;
}

function serializeRecurringTransaction(crt: CreateRecurringTransaction) {
    switch (crt.recurrenceRule.recurrenceType) {
    case "monthly": return JSON.stringify({ 
        name: crt.name, 
        amount: crt.amount, 
        recurrence_rule: { 
            recurrence_type: "monthly",
            day: crt.recurrenceRule.day,
        }
    });
    case "weekly": 
        let basisDate: string | null = null;
        if (crt.recurrenceRule.basis) {
            basisDate = serializeDate(crt.recurrenceRule.basis);
        }
        return JSON.stringify({ 
            name: crt.name, 
            amount: crt.amount, 
            recurrence_rule: { 
                recurrence_type: "weekly",
                day: crt.recurrenceRule.day,
                interval: crt.recurrenceRule.interval,
                basis: basisDate,
            }
        });
    }
}

export class Client {
    recurringTransactions: RecurringTransaction[] = [];
    scheduledTransactions: ScheduledTransaction[] = [];

    loading: boolean = false;
    error: string | null = null;

    constructor(config: (c: Client) => void = () => {}) {
        config(this);
    }

    async addRecurringTransaction(crt: CreateRecurringTransaction) {
        this.updateLoading(true);

        let resp = await fetch(`${API_HOST}/recurring_transactions`, {
            method: "POST",
            body: serializeRecurringTransaction(crt),
            headers: {
                'Content-Type': "application/json",
            },
        });
 
        this.updateNewRecurringTransaction(await resp.json());
    }

    async viewRecurringTransactions() {
        this.updateLoading(true);
        let resp = await fetch(`${API_HOST}/recurring_transactions`);
        
        this.updateRecurringTransactions(await resp.json());
    }

    async viewScheduledTransactions(start: Date, end: Date) {
        this.updateLoading(true);
        let resp = await fetch(`${API_HOST}/scheduled_transactions?start_date=${serializeDate(start)}&end_date=${serializeDate(end)}`);

        this.updateScheduledTransactions(await resp.json());
    }

    async setup() {
        return fetch(`${API_HOST}/setup`, {
            method: "POST",
        });
    }

    async teardown() {
        return fetch(`${API_HOST}/teardown`, {
            method: "POST",
        });
    }

    updateNewRecurringTransaction(json: RecurringTransactionResponse) {
        this.loading = false;
        switch (json.type) {
        case "recurring_transaction":
            this.recurringTransactions = [...this.recurringTransactions, normalizeRecurringTransaction(json)];
            break;
        case "error":
            this.error = json.message;
            break;
        default:
            console.log("Default was hit when updating new recurring transaction")
        };
    }

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
}