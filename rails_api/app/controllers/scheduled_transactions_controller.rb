class ScheduledTransactionsController < ApplicationController
  def index
    rts = RecurringTransaction.all
    sts = rts.flat_map { |rt| 
      ScheduledTransaction.expand_from_recurring_transaction(
        rt, 
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
    }

    puts "Recurring transactions: #{rts.to_a}"

    render json: { type: 'scheduled_transactions', scheduled_transactions: sts }
  end
end