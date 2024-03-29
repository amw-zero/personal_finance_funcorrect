import React, { useEffect, useContext, useState } from 'react';
import { observer } from 'mobx-react-lite'
import { autorun } from 'mobx';
import { ClientContext } from './clientContext'
import { CreateRecurringTransaction, RecurringTransaction, RecurrenceRule } from './state';
import { Formik, Field } from 'formik';
import { FormField } from './components/FormField';
import { RadioGroup, RadioGroupOption } from './components/RadioGroup';
import { TextInput } from './components/TextInput';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet
} from "react-router-dom";
import './App.css';
import { Container } from './components/Container';

type RecurringTransactionFormValues = {
  name: string;
  amount: number;
  recurrenceRule: {
    recurrenceType: RecurrenceName;
    day: number | null; 
    basis: string;
    interval: number | "";
  }
}

interface RecurringTransactionFormProps {
  isActive: boolean;  
  onCloseRecurringTransactionForm: () => void;
  initialValues?: RecurringTransactionFormValues;
  editingTransactionId?: number;
}

type RecurrenceName = "monthly" | "weekly";

function renderRecurrenceTypeFields(recurrenceType: RecurrenceName) {
  switch (recurrenceType) {
  case "weekly": return (
    <FormField>
      <TextInput name="recurrenceRule.day" label="Day of week" type="number" />
      <TextInput name="recurrenceRule.interval" label="Interval" type="number" />
      <label className="label">Occurs on</label>
      <Field name="recurrenceRule.basis" className="mt-4 mb-4" type="date" />
    </FormField>
  );
  case "monthly": return (
    <FormField>
      <TextInput name="recurrenceRule.day" label="Day of month" type="number" />
    </FormField>
  );
  }
}

function datePickerStrToDate(ds: string): Date {
  let options: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  },
  formatter = new Intl.DateTimeFormat([], options);

  return new Date(formatter.format(new Date(ds)));
}

function createRecurringTransFromRecurringTransactionFormValues(values: RecurringTransactionFormValues): CreateRecurringTransaction | null {
  switch (values.recurrenceRule.recurrenceType) {
    case "monthly":
      if (values.recurrenceRule.day === null) {
        return null;
      }

      return { name: values.name, amount: values.amount, recurrenceRule: { recurrenceType: "monthly", day: values.recurrenceRule.day } }
    case "weekly":
      let basisDate: Date | null = null;
      let intervalNumber: number | null = null;
      if (values.recurrenceRule.interval) {
        intervalNumber = values.recurrenceRule.interval;
      }

      if (values.recurrenceRule.basis) {
        basisDate = datePickerStrToDate(values.recurrenceRule.basis);
      }

      return {
        name: values.name,
        amount: values.amount,
        recurrenceRule: {
          recurrenceType: "weekly",
          day: 1,
          interval: intervalNumber,
          basis: basisDate,
        }
      };
  }
}

function RecurringTransactionForm({ onCloseRecurringTransactionForm, isActive, initialValues, editingTransactionId }: RecurringTransactionFormProps) {
  const client = useContext(ClientContext);
  
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceName>("monthly");
  const selectRecurrenceType = (o: RadioGroupOption) => setRecurrenceType(o.value as RecurrenceName );

  const onCreateSubmit = async (values: RecurringTransactionFormValues) => {
    let data = createRecurringTransFromRecurringTransactionFormValues(values);
    if (data === null) {
      return;
    }

    await client.AddRecurringTransaction(data);
    onCloseRecurringTransactionForm();
  };

  const onEditSubmit = async (values: RecurringTransactionFormValues) => {
    let data = createRecurringTransFromRecurringTransactionFormValues(values);
    if (data === null) {
      return;
    }

    await client.editRecurringTransaction({...data, id: editingTransactionId!});
    onCloseRecurringTransactionForm();
  };

  const submitFunc = editingTransactionId ? onEditSubmit : onCreateSubmit;

  let classnames = `modal ${isActive ? "is-active": ""}`;

  const initValues = initialValues ?? { name: '', amount: 0, recurrenceRule: { recurrenceType: "monthly", day: 1, interval: "", basis: "" }};

  return (
    <>
      <div className={classnames}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Create Recurring Transaction</p>
            <button className="delete" aria-label="close" onClick={onCloseRecurringTransactionForm}></button>
          </header>
          <Formik<RecurringTransactionFormValues> initialValues={initValues} onSubmit={submitFunc}>
            {({handleSubmit, handleChange, handleBlur, values}) => {
              return (
              <section className="modal-card-body">
              <form onSubmit={handleSubmit}>
                <FormField>
                  <label className="label">Name</label>
                  <div className="control">
                    <input className="input" name="name" type="text" placeholder="name" value={values.name} onChange={handleChange} onBlur={handleBlur}/>
                  </div>
                </FormField>  

                <FormField>
                  <label className="label">Amount</label>
                  <div className="control">
                    <input className="input" name="amount" type="number" placeholder="amount" value={values.amount} onChange={handleChange} onBlur={handleBlur} />
                  </div>
                </FormField>

                <h2 className="is-size-4 mb-4 mt-4">Recurrence Rule</h2>
                <FormField>
                  <RadioGroup 
                    options={[
                      {
                        name: "recurrenceRule.recurrenceType",
                        label: "Monthly",
                        value: "monthly"
                      },
                      {
                        name: "recurrenceRule.recurrenceType",
                        label: "Weekly",
                        value: "weekly",
                      }
                    ]}
                    onSelectOption={selectRecurrenceType}
                    handleChange={handleChange}
                  />
                </FormField>

                {renderRecurrenceTypeFields(recurrenceType)}

                <div className="field is-grouped">
                  <div className="control">
                    <button className="button is-link" type="submit">Submit</button>
                  </div>
                  <div className="control">
                    <button className="button is-link is-light">Cancel</button>
                  </div>
                </div>
              </form>
              </section>
          )}}
          </Formik>
        </div>
      </div>
      
    </>
  );
}

function displayWeekDay(dateStr: string): string {
  let date = new Date(dateStr);

  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ][date.getDay()];
}

function displayRecurrenceRule(rule: RecurrenceRule) {
  switch (rule.recurrenceType) {
    case "monthly":
      return `Monthly, on ${rule.day}`;
    case "weekly":
      if (rule.interval !== null && rule.basis !== null) {
        return `Every ${rule.interval} weeks on ${displayWeekDay(rule.basis)}`;
      }
      
      return `Weekly, on ${rule.day}`;
  }
}

type RecurringTransactionRowProps = {
  recurringTransaction: RecurringTransaction;
  onClickRow: (rt: RecurringTransaction) => void;
}

const RecurringTransactionRow = ({ recurringTransaction: rt, onClickRow }: RecurringTransactionRowProps) => {
  return (
    <tr className="recurring-transaction-row" onClick={() => onClickRow(rt)} >
      <td>{rt.name}</td>
      <td>{rt.amount}</td>
      <td>{displayRecurrenceRule(rt.recurrenceRule)}</td>
    </tr>
  )
}

type RecurringTransactionLimitProps = {
  onClickRow: (rt: RecurringTransaction) => void
}

const RecurringTransactionList = observer(({ onClickRow }: RecurringTransactionLimitProps) => {
  const client = useContext(ClientContext);

  useEffect(
    () => autorun(() => {
      console.log("Fetching recurring transactions");
      client.viewRecurringTransactions()
    }),
    [client]
  );

   return (
    <Container>
      <table className="table full-width">
        <thead>
          <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Recurrence Rule</th>
          </tr>
        </thead>
        <tbody>
          {client.recurringTransactions.map(rt => (
            <RecurringTransactionRow key={rt.id} recurringTransaction={rt} onClickRow={onClickRow} />
          ))}
        </tbody>
      </table>
    </Container>
  );
});

const DECEMBER = 11;

function padTwoDigitNum(n: number): string {
  return n.toString().padStart(2, "0");
}
function formatDateForDatePicker(d: Date): string {
  let month = padTwoDigitNum(d.getMonth() + 1);
  let day = padTwoDigitNum(d.getDate());
  return `${d.getFullYear()}-${month}-${day}`;
}


function currentMonthDates(): [string, string] {
  let currDate = new Date();
  let monthStart = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
  let currMonth = currDate.getMonth();

  let nextMonthStart = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 1);
  if (currMonth === DECEMBER) {
    nextMonthStart.setFullYear(currDate.getFullYear() + 1);
  }

  let monthEnd = new Date(nextMonthStart.getTime() - 1 * 1000 * 3600 * 24)

  return [formatDateForDatePicker(monthStart), formatDateForDatePicker(monthEnd)];
}

const ScheduledTransactionList = observer(() => {
  const client = useContext(ClientContext);

  let [monthStart, monthEnd] = currentMonthDates();

  const [startDate, setStartDate] = useState<string>(monthStart);
  const [endDate, setEndDate] = useState<string>(monthEnd);

  useEffect(
    () => autorun(() => client.viewScheduledTransactions(datePickerStrToDate(startDate), datePickerStrToDate(endDate))),
    [client, client.recurringTransactions, startDate, endDate]
  );

  return (
    <Container>
      <div className="block">
        <div className="columns is-v-centered">
          <div className="column has-text-centered">
            <label className="label">Start date</label>
            <input type="date" value={startDate} onChange={(e) => {
              setStartDate(e.target.value)
            }} />
          </div>

          <div className="column has-text-centered">
            <label className="label">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="block">
        <div className="is-flex is-justify-content-center">
          <div className="notification full-width has-text-centered">
            <span>
            <label className="label mr-2">Sum:</label>
            {client.scheduledTransactions.reduce((a, st) => a + st.amount, 0)}
            </span>
          </div>
        </div>
      </div>

      <table className="table full-width has-text-centered">
        <thead>
          <tr>
            <th className="has-text-centered">Name</th>
            <th className="has-text-centered">Amount</th>
            <th className="has-text-centered">Date</th>
          </tr>
        </thead>
        <tbody>
          {client.scheduledTransactions.map(st => (
            <tr key={`${st.name}${st.date}`}>
              <td>{st.name}</td>
              <td>{st.amount}</td>
              <td>{st.date.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
});

interface NavbarProps {
  onShowRecurringTransactionForm: () => void;
}

function Navbar({ onShowRecurringTransactionForm }: NavbarProps) {
  return (
    <>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <button className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-start">
            <Link to="/" className="navbar-item">
              Recurring Transactions
            </Link>
            <Link to="/scheduled-transactions" className="navbar-item">
              Scheduled Transactions
            </Link>
          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <button className="button is-primary" onClick={() => onShowRecurringTransactionForm()}>
                  <strong>Create Recurring Transaction</strong>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

interface LayoutProps {
  onShowRecurringTransactionForm: () => void;
}

function Layout({ onShowRecurringTransactionForm }: LayoutProps) {
  return (
    <>
      <Navbar onShowRecurringTransactionForm={onShowRecurringTransactionForm}/>
      <div className="columns is-centered">
        <div className="column is-half">
          <Outlet />
        </div>
      </div>
    </>
  )
}

const editInitValues = (rt: RecurringTransaction): RecurringTransactionFormValues | null => {
  switch (rt.recurrenceRule.recurrenceType) {
    case "monthly":
      return { 
        name: rt.name, 
        amount: rt.amount, 
        recurrenceRule: { 
          recurrenceType: "monthly", 
          day: rt.recurrenceRule.day, 
          interval: "",
          basis: "",
        }
      }
    case "weekly":
      return { 
        name: rt.name, 
        amount: rt.amount, 
        recurrenceRule: { 
          recurrenceType: "weekly", 
          day: rt.recurrenceRule.day, 
          interval: rt.recurrenceRule.interval ?? "", 
          basis: rt.recurrenceRule.basis ?? "", 
        }
      }
  }

  return null;
}

type RecurringTransactionActionMenuProps = {
  isActive: boolean
  recurringTransaction: RecurringTransaction
  onClickEdit: () => void
  onClose: () => void
}

function RecurringTransactionActionMenu({ isActive, recurringTransaction, onClickEdit, onClose }: RecurringTransactionActionMenuProps) {
  const client = useContext(ClientContext);

  const classnames = `modal ${isActive ? "is-active": ""}`;

  const onClickDelete = async () => {
    await client.DeleteRecurringTransaction(recurringTransaction.id);
    onClose();
  }

  return (
    <>
       <div className={classnames}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Recurring Transaction Action</p>
            <button className="delete" aria-label="close" onClick={onClose}></button>
          </header>
          <section className="modal-card-body">
            <button className="button is-warning" onClick={onClickEdit}>
              Edit
            </button>
            <button className="button is-danger" onClick={onClickDelete}>
              Delete
            </button>
          </section>
        </div>
      </div>
    </>
  )
}

function App() {
  const [showingRecurringTransactionForm, setShowingRecurringTransactionForm] = useState(false);
  const [showingRecurringTransactionActionMenu, setShowingRecurringTransactionActionMenu] = useState(false);
  const [showingEditRecurringTransactionForm, setShowingEditRecurringTransactionForm] = useState(false);
  const [actionRecurringTransaction, setActionRecurringTransaction] = useState<RecurringTransaction | null>(null);

  const onClickRecurringTransaction = (recurringTransaction: RecurringTransaction) => {
    setShowingRecurringTransactionActionMenu(true);
    setActionRecurringTransaction(recurringTransaction);
  }

  const onClickEditTransaction = () => {
    setShowingEditRecurringTransactionForm(true);
    setShowingRecurringTransactionActionMenu(false);
  }

  const closeEditTransactionForm = () => {
    setShowingEditRecurringTransactionForm(false);
    setActionRecurringTransaction(null);
  }

  return (
    <>
      {showingRecurringTransactionForm && (
        <RecurringTransactionForm isActive={showingRecurringTransactionForm} onCloseRecurringTransactionForm={() => setShowingRecurringTransactionForm(false)}/>
      )}
      {showingEditRecurringTransactionForm && actionRecurringTransaction && (
        <RecurringTransactionForm 
          editingTransactionId={actionRecurringTransaction.id}
          initialValues={editInitValues(actionRecurringTransaction)!}
          isActive={showingEditRecurringTransactionForm}
          onCloseRecurringTransactionForm={closeEditTransactionForm}
        />
      )}
      {showingRecurringTransactionActionMenu && actionRecurringTransaction && (
        <RecurringTransactionActionMenu 
          isActive={showingRecurringTransactionActionMenu} 
          recurringTransaction={actionRecurringTransaction} 
          onClickEdit={onClickEditTransaction}
          onClose={() => setShowingRecurringTransactionActionMenu(false) }
        />
      )}
      <Router>
      <Routes>
        <Route path="/" element={<Layout onShowRecurringTransactionForm={() => setShowingRecurringTransactionForm(true)}/>}>
          <Route path="/" element={<RecurringTransactionList onClickRow={onClickRecurringTransaction}/>} />
          <Route path="/scheduled-transactions" element={<ScheduledTransactionList />} /> 
        </Route>
      </Routes>
      </Router>
    </>
  );
}

export default App;
