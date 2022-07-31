class RecurringTransactionsController < ApplicationController
  def index
    recurring_transactions = RecurringTransaction.all

    render json: { type: 'recurring_transactions', recurring_transactions: recurring_transactions.map { |rt| serialize_recurring_transaction(rt) } }
  end

  def create
    rt = RecurringTransaction.new(recurring_transaction_params)    
    if rt.save
      render json: serialize_recurring_transaction(rt)
    else
      render json: { type: 'error', message: rt.errors }
    end
  end

  def recurring_transaction_params
    params.require(:recurring_transaction).permit(:amount, :name, recurrence_rule: [:recurrenceType, :day, :basis])
  end

  private

  def serialize_recurring_transaction(rt)
    {
      id: rt.id,
      type: 'recurring_transaction',
      name: rt.name,
      amount: rt.amount,
      recurrence_rule: rt.recurrence_rule.to_h.merge({
        recurrence_type: rt.recurrence_rule.recurrence_type,
      })
    }
  end
end