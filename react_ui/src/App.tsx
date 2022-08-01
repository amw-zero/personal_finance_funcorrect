import React, { useEffect, useContext, useState } from 'react';
import {observer} from 'mobx-react-lite'
import {autorun} from 'mobx';
import { CreateRecurringTransaction } from './state';
import { ClientContext } from './clientContext'
import { Formik, Form, Field, ErrorMessage } from 'formik';
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

  const onSubmit = (values: FormValues) => {
    console.log("Submitting", values);
    client.addRecurringTransaction({
      name: values.name,
      amount: values.amount,
      recurrenceRule: { recurrenceType: "weekly", day: 1, basis: new Date(), interval: 0 }
    })
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
    Test
    <p>{client.recurringTransactions.length}</p>
    {client.recurringTransactions.map((rt) => (
      <p key={rt.id}>{rt.name}</p>
    ))}
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
      {client.scheduledTransactions.map(st => (
        <div key={`${st.name}${st.date}`}>
          <>
            <p>Name: {st.name}</p>
            <p>{`Date: ${st.date}`}</p>
          </>
        </div>
      ))}
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
      <a className="navbar-item">
        Home
      </a>

      <a className="navbar-item">
        Documentation
      </a>

      <div className="navbar-item has-dropdown is-hoverable">
        <a className="navbar-link">
          More
        </a>

        <div className="navbar-dropdown">
          <a className="navbar-item">
            About
          </a>
          <a className="navbar-item">
            Jobs
          </a>
          <a className="navbar-item">
            Contact
          </a>
          <hr className="navbar-divider" />
          <a className="navbar-item">
            Report an issue
          </a>
        </div>
      </div>
    </div>

    <div className="navbar-end">
      <div className="navbar-item">
        <div className="buttons">
          <a className="button is-primary" onClick={() => onShowRecurringTransactionForm()}>
            <strong>Create Recurring Transaction</strong>
          </a>
          <a className="button is-light">
            Log in
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>
    </>
  );
}

function App() {
  const [showingRecurringTransactionForm, setShowingRecurringTransactionForm] = useState(false);
  return (
    <div className="container">
      <Navbar onShowRecurringTransactionForm={() => setShowingRecurringTransactionForm(true)}/>      
      <RecurringTransactionForm isActive={showingRecurringTransactionForm} onCloseRecurringTransactionForm={() => setShowingRecurringTransactionForm(false)}/>
      <RecurringTransactionList />
      <h2>Scheduled Transactions</h2>
      <ScheduledTransactionList />

    </div>
  );
}

export default App;

