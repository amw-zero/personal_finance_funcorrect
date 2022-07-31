class ScheduledTransactionsController < ApplicationController
  def index
    rts = RecurringTransaction.all
    sts = rts.flat_map { |rt| 
      ScheduledTransaction.expand_recurring_transaction(
        rt, 
        Date.parse(params[:start_date]), 
        Date.parse(params[:end_date])
      )
    }

    render json: { type: 'scheduled_transactions', scheduled_transactions: sts }
  end
end