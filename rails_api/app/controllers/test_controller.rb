class TestController < ApplicationController
  def setup
    DatabaseCleaner.strategy = DatabaseCleaner::ActiveRecord::Truncation.new(pre_count: true)
    DatabaseCleaner.start
  end

  def teardown
    DatabaseCleaner.clean
  end
end