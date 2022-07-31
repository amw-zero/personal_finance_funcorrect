import React, { useEffect, useContext } from 'react';
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

function RecurringTransactionForm() {
  const client = useContext(ClientContext);

  const onSubmit = (values: FormValues) => {
    console.log("Submitting", values);
    client.addRecurringTransaction({
      name: values.name,
      amount: values.amount,
      recurrenceRule: { recurrenceType: "monthly", day: 5}
    })
  };

  return (
    <>
      <Formik initialValues={{ name: '', amount: 0 }} onSubmit={onSubmit}>
        {({handleSubmit, handleChange, handleBlur, values}) => (

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

        )}
      </Formik>
    </>
  );
}

const RecurringTransactionList = observer(() => {
  const client = useContext(ClientContext);
  useEffect(
    () => autorun(() => {
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

function App() {
  return (
    <div className="container">
      <h1 className="title">
        Create Recurring Transaction
      </h1>

      <RecurringTransactionForm />
      <RecurringTransactionList />

    </div>
  );
}

export default App;

