import React from 'react';
import './App.css';

function RecurringTransactionForm() {
  return (
    <>
      <div className="field">
        <label className="label">Name</label>
        <div className="control">
          <input className="input" type="text" placeholder="name" />
        </div>
      </div>

      <div className="field">
        <label className="label">Amount</label>
        <div className="control">
          <input className="input" type="number" placeholder="amount" />
        </div>
      </div>

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

      <div className="field is-grouped">
        <div className="control">
          <button className="button is-link">Submit</button>
        </div>
        <div className="control">
          <button className="button is-link is-light">Cancel</button>
        </div>
      </div>
    </>
  )
}

function App() {
  return (
    <div className="container">
      <h1 className="title">
        Create Recurring Transaction
      </h1>
      <p className="subtitle">
        My first website with <strong>Bulma</strong>!
      </p>
      <RecurringTransactionForm />
      
    </div>
  );
}

export default App;
