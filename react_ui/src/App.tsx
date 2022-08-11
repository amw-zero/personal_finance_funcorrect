import React, { useEffect, useContext, useState } from 'react';
import {observer} from 'mobx-react-lite'
import {autorun, reaction} from 'mobx';
import { ClientContext } from './clientContext'
import { CreateRecurringTransaction, RecurrenceRule } from './state';
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

type FormValues = {
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

function formatDateStr(ds: string): Date {
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

function createRecurringTransFromFormValues(values: FormValues): CreateRecurringTransaction | null {
  console.log("Converting values", values);
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
        basisDate = formatDateStr(values.recurrenceRule.basis);
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

function RecurringTransactionForm({ onCloseRecurringTransactionForm, isActive }: RecurringTransactionFormProps) {
  const client = useContext(ClientContext);
  
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceName>("monthly");
  console.log({recurrenceType});
  const selectRecurrenceType = (o: RadioGroupOption) => setRecurrenceType(o.value as RecurrenceName );

  const onSubmit = async (values: FormValues) => {
    let data = createRecurringTransFromFormValues(values);
    if (data === null) {
      return;
    }

    await client.addRecurringTransaction(data);
    onCloseRecurringTransactionForm();
  };

  let classnames = `modal ${isActive ? "is-active": ""}`;

  return (
    <>
      <div className={classnames}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Create Recurring Transaction</p>
            <button className="delete" aria-label="close" onClick={onCloseRecurringTransactionForm}></button>
          </header>
          <Formik<FormValues> initialValues={{ name: '', amount: 0, recurrenceRule: { recurrenceType: "monthly", day: 1, interval: "", basis: (new Date()).toString() }}} onSubmit={onSubmit}>
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

function displayRecurrenceRule(rule: RecurrenceRule) {
  switch (rule.recurrenceType) {
    case "monthly":
      return `Monthly, on ${rule.day}`;
    case "weekly":
      if (rule.interval !== null && rule.basis !== null) {
        return `Every ${rule.interval} weeks, starting on ${rule.basis}`;
      }
      
      return `Weekly, on ${rule.day}`;
  }
}

const RecurringTransactionList = observer(() => {
  const client = useContext(ClientContext);

  useEffect(
    () => autorun(() => {
      console.log("Fetching recurring transactions");
      client.viewRecurringTransactions()
    }), 
    []
  );
  
  return (
    <Container>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Recurrence Rule</th>
          </tr>
        </thead>
        <tbody>
          {client.recurringTransactions.map(rt => (
            <tr key={rt.id}>
              <td>{rt.name}</td>
              <td>{displayRecurrenceRule(rt.recurrenceRule)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
});

const ScheduledTransactionList = observer(() => {
  const client = useContext(ClientContext);

  useEffect(
    () => reaction(
      () => client.recurringTransactions,
      () => client.viewScheduledTransactions(new Date("July 1 2022"), new Date("July 31 2022"))
    ), 
    []
  );

  useEffect(
    () => autorun(() => client.viewScheduledTransactions(new Date("July 1 2022"), new Date("July 31 2022"))),
    []
  );

  return (
    <Container>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Date</th>
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
          <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
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
                <a className="button is-primary" onClick={() => onShowRecurringTransactionForm()}>
                  <strong>Create Recurring Transaction</strong>
                </a>
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

function App() {
  const [showingRecurringTransactionForm, setShowingRecurringTransactionForm] = useState(false);
  return (
    <>
      {showingRecurringTransactionForm && (
        <RecurringTransactionForm isActive={showingRecurringTransactionForm} onCloseRecurringTransactionForm={() => setShowingRecurringTransactionForm(false)}/>
      )}
      <Router>
      <Routes>
        <Route path="/" element={<Layout onShowRecurringTransactionForm={() => setShowingRecurringTransactionForm(true)}/>}>
          <Route path="/" element={<RecurringTransactionList />} />
          <Route path="/scheduled-transactions" element={<ScheduledTransactionList />} /> 
        </Route>
      </Routes>
      </Router>
    </>
  );
}

export default App;
