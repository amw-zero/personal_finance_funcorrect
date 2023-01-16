class TestController < ApplicationController
  def setup
    tables = state_params.keys
    DatabaseCleaner.strategy = [:truncation, only: tables]
    DatabaseCleaner.start

    puts "[TestController] params - #{params}"
    puts
    puts "[TestController] strong params - #{state_params}"
    puts

    state_params.each do |model, value|
      lookup_model_klass(model).create!(value)
    end

    puts "[TestController] created data: #{RecurringTransaction.all.to_a.to_s}"
    puts
  end

  def teardown
    puts "[TestController] - teardown"
    DatabaseCleaner.clean
  end

  private

  def lookup_model_klass(model_name)
    case model_name
    when 'recurring_transactions' 
      RecurringTransaction
    else
      puts "[TestController] unknown model name: #{model_name}"
      raise "Attempted to setup unknown model: #{model_name}"
    end
  end

  def state_params
    params.deep_transform_keys(&:underscore).require(:state).permit(
      recurring_transactions: [:id, :amount, :name, recurrence_rule: 
        [:recurrence_type, :day, :basis, :interval]
      ])
  end
end