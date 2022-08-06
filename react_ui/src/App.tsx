import React, { useEffect, useContext, useState, FC } from 'react';
import {observer} from 'mobx-react-lite'
import {autorun} from 'mobx';
import { CreateRecurringTransaction } from './state';
import { ClientContext } from './clientContext'
import { Formik, Form, Field, ErrorMessage } from 'formik';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet
} from "react-router-dom";
import './App.css';

interface FormValues {
  name: string;
  amount: number;
}

interface RecurringTransactionFormProps {
  isActive: boolean;
  onCloseRecurringTransactionForm: () => void;
}

function RecurringTransactionForm({ onCloseRecurringTransactionForm, isActive }: RecurringTransactionFormProps) {
  const client = useContext(ClientContext);

  const onSubmit = async (values: FormValues) => {
    console.log("Submitting", values);
    await client.addRecurringTransaction({
      name: values.name,
      amount: values.amount,
      recurrenceRule: { recurrenceType: "weekly", day: 1, basis: new Date(), interval: 0 }
    });
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
          <Formik initialValues={{ name: '', amount: 0 }} onSubmit={onSubmit}>
            {({handleSubmit, handleChange, handleBlur, values}) => (
              <section className="modal-card-body">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label className="label">Name</label>
                  <div className="control">
                    <input className="input" name="name" type="text" placeholder="name" value={values.name} onChange={handleChange} onBlur={handleBlur}/>
                  </div>
                </div>  

                <div className="field">
                  <label className="label">Amount</label>
                  <div className="control">
                    <input className="input" name="amount" type="number" placeholder="amount" value={values.amount} onChange={handleChange} onBlur={handleBlur} />
                  </div>
                </div>

                {/*
                <div className="field">
                  <label className="label">Username</label>
                  <div className="control has-icons-left has-icons-right">
                    <input className="input is-success" type="text" placeholder="Text input" value="bulma" />
                    <span className="icon is-small is-left">
                      <i className="fas fa-user"></i>
                    </span>
                    <span className="icon is-small is-right">
                      <i className="fas fa-check"></i>
                    </span>
                  </div>
                  <p className="help is-success">This username is available</p>
                </div>

                <div className="field">
                  <label className="label">Email</label>
                  <div className="control has-icons-left has-icons-right">
                    <input className="input is-danger" type="email" placeholder="Email input" value="hello@" />
                    <span className="icon is-small is-left">
                      <i className="fas fa-envelope"></i>
                    </span>
                    <span className="icon is-small is-right">
                      <i className="fas fa-exclamation-triangle"></i>
                    </span>
                  </div>
                  <p className="help is-danger">This email is invalid</p>
                </div>

                <div className="field">
                  <label className="label">Subject</label>
                  <div className="control">
                    <div className="select">
                      <select>
                        <option>Select dropdown</option>
                        <option>With options</option>
                      </select>
                    </div>
                  </div>
                </div>
                */}

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
            )}
          </Formik>
        </div>
      </div>
      
    </>
  );
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
  
  return <>
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
              <td>{rt.recurrenceRule.recurrenceType}</td>
            </tr>
          ))}
        </tbody>
      </table>
  </>
});

const ScheduledTransactionList = observer(() => {
  const client = useContext(ClientContext);

  useEffect(
    () => autorun(() => {
      console.log("Fetching scheduled transactions");
      client.viewScheduledTransactions(new Date("July 1 2022"), new Date("August 31 2022"));
    }), 
    []
  );
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Recurrence Rule</th>
          </tr>
        </thead>
        <tbody>
          {client.scheduledTransactions.map(st => (
            <tr key={`${st.name}${st.date}`}>
              <td>{st.name}</td>
              <td>{st.date.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
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
      <div className="container">
        <Outlet />
      </div>
    </>
  )
}

function App() {
  const [showingRecurringTransactionForm, setShowingRecurringTransactionForm] = useState(false);
  return (
    <>
      <RecurringTransactionForm isActive={showingRecurringTransactionForm} onCloseRecurringTransactionForm={() => setShowingRecurringTransactionForm(false)}/>
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

