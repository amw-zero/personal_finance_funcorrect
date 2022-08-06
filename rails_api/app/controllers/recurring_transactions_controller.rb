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
    params.require(:recurring_transaction).permit(:amount, :name, recurrence_rule: [:recurrenceType, :day, :basis, :interval])
  end

  private

  def serialize_recurrence_rule(rr)
    case rr
    when RecurrenceRule::Monthly
      rr.to_h.merge({
        recurrence_type: rr.recurrence_type,
      })
    when RecurrenceRule::Weekly
      rr.to_h.merge({
        basis: rr.basis&.strftime('%Y-%m-%dT%H:%M:%S.%NZ'),
        recurrence_type: rr.recurrence_type,
      })
    end
  end

  def serialize_recurring_transaction(rt)
    {
      id: rt.id,
      type: 'recurring_transaction',
      name: rt.name,
      amount: rt.amount,
      recurrence_rule: serialize_recurrence_rule(rt.recurrence_rule),
    }
  end
end