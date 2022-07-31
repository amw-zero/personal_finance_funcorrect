ScheduledTransaction = Struct.new(:date, :name, :amount) do
  def self.expand_from_recurring_transaction(rt, start_date, end_date)
    puts "Expanding recurring transaction - #{start_date}, #{end_date}"
  end
end
