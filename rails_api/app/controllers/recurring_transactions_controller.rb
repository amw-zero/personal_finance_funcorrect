class RecurringTransactionsController < ApplicationController
  def index
    @recurring_transactions = RecurringTransaction.all

    render json: @recurring_transactions
  end

  def create
    rt = RecurringTransaction.create!(recurring_transaction_params)
    if rt
      render json: :ok
    else
      render json: { error: 'fail' }
    end
  end

  def recurring_transaction_params
    params.permit(:amount, :recurrence_rule, :name)
  end
end