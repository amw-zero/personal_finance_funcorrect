
class TestController < ApplicationController
  def setup
    puts 'Test#setup'
    DatabaseCleaner.strategy = :truncation
    DatabaseCleaner.start
  end

  def teardown
    puts 'Test#teardown'
    DatabaseCleaner.clean
  end
end