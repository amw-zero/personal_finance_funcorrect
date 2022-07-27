class RecurringTransactionsController < ApplicationController
  def index
    @recurring_transactions = RecurringTransaction.all

    render json: @recurring_transactions
  end

  def create
    puts "Creating: #{recurring_transaction_params}"
    puts params
    @rt = RecurringTransaction.new(recurring_transaction_params)
    if @rt.save
      render json: @rt
    else
      render json: { error: @rt.errors }
    end
  end

  def recurring_transaction_params
    params.require(:recurring_transaction).permit(:amount, :recurrence_rule, :name)
  end
end