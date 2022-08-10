class ScheduledTransactionsController < ApplicationController
  def index
    rts = RecurringTransaction.all
    sts = rts.flat_map do |rt| 
      ScheduledTransaction.expand_recurring_transaction(
        rt, 
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
  end.sort { |st1, st2| st1.date == st2.date ? st2.name <=> st1.name : st1.date <=> st2.date }

    render json: { type: 'scheduled_transactions', scheduled_transactions: sts.map { |st| serialize_scheduled_transaction(st) } }
  end

  private

  def serialize_scheduled_transaction(st)
    {
      date: st.date.strftime('%m/%d/%Y'),
      name: st.name,
      amount: st.amount
    }
  end
end