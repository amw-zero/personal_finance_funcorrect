ScheduledTransaction = Struct.new(:date, :name, :amount) do
  def self.expand_recurring_transaction(rt, start_date, end_date)
    if start_date >= end_date
        puts "expandRecurringTransaction: start date must be before end date, got start: #{start_date}, end: #{end_date}"
        return [];
    end

    start_date.upto(end_date).select { |d| rt.recurrence_rule.applies?(d) }
  end

  def self.expand_from_recurring_transaction(rt, start_date, end_date)
    puts "Expanding recurring transaction - #{start_date}, #{end_date}"
    this.recurringTransactions.flat_map do |rt|
      expandRecurringTransaction(rt, start, end).map { |d| ScheduleTransaction.new(d, rt.name, rt.amount) }
    end
  end
end
