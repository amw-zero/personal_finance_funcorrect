class ScheduledTransactionsController < ApplicationController
  def index
    rts = RecurringTransaction.all
    puts '1'
    puts params[:start_date]
    Date.parse(params[:start_date])
    Date.parse(params[:end_date])
    puts 'parsed date'
    puts rts.to_a.map { |rt| rt.recurrence_rule.inspect }
    sts = rts.flat_map do |rt| 
      ScheduledTransaction.expand_recurring_transaction(
        rt, 
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
    end.sort { |st1, st2| st1.date <=> st2.date }

    puts '2'

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