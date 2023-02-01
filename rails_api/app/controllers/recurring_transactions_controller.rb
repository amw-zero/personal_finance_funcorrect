class RecurringTransactionsController < ApplicationController
  def index
    recurring_transactions = RecurringTransaction.all

    render json: { type: 'recurring_transactions', recurring_transactions: recurring_transactions.map { |rt| serialize_recurring_transaction(rt) } }
  end

  def create
    puts "[RecurringTransactionsController] params: #{params}"
    puts
    puts "[RecurringTransactionsController] string params: #{recurring_transaction_params}"
    puts
    rt = RecurringTransaction.new(recurring_transaction_params)

    if rt.save
      render json: serialize_recurring_transaction(rt)
    else
      render json: { type: 'error', message: rt.errors }
    end
  end

  def update
    rt = RecurringTransaction.find(params[:id])

    if rt.update(recurring_transaction_params)
      render json: serialize_recurring_transaction(rt)
    else
      render json: { type: 'error', message: rt.errors }
    end
  end

  def destroy
    rt = RecurringTransaction.find(params[:id])

    if rt.destroy
      render json: { type: 'recurring_transactions_delete_success' }
    else
      render json: { type: 'error', message: rt.errors }
    end
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
        basis: rr.basis&.strftime('%m/%d/%Y'),
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

  
  def recurring_transaction_params
    params.require(:recurring_transaction).permit(:amount, :name, recurrence_rule: [:recurrence_type, :day, :basis, :interval])
  end
end