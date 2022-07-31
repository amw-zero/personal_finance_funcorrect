class RecurringTransactionsController < ApplicationController
  def index
    @recurring_transactions = RecurringTransaction.all

    render json: @recurring_transactions
  end

  def create
    @rt = RecurringTransaction.new(recurring_transaction_params)
    if @rt.save
      puts "Saved RecurringTransaction: #{RecurringTransaction.all.to_a}"
      render json: @rt.attributes.to_h.merge({ type: 'recurring_transaction' })
    else
      render json: { type: 'error', message: @rt.errors }
    end
  end

  def recurring_transaction_params
    params.require(:recurring_transaction).permit(:amount, :recurrence_rule, :name)
  end
end