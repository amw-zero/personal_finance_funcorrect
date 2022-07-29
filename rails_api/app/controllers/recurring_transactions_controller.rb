class RecurringTransactionsController < ApplicationController
  def index
    @recurring_transactions = RecurringTransaction.all

    render json: @recurring_transactions
  end

  def create
    puts "Creating: #{recurring_transaction_params}"
    @rt = RecurringTransaction.new(recurring_transaction_params)
    if @rt.save
      puts "RT Create success"
      render json: @rt
    else
      puts "RT Create fail"
      render json: { error: @rt.errors }
    end
  end

  def recurring_transaction_params
    params.require(:recurring_transaction).permit(:amount, :recurrence_rule, :name)
  end
end