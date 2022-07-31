ScheduledTransaction = Struct.new(:date, :name, :amount) do
  def self.expand_recurring_transaction(rt, start_date, end_date)
    if start_date >= end_date
        puts "expandRecurringTransaction: start date must be before end date, got start: #{start_date}, end: #{end_date}"
        return [];
    end

    start_date.upto(end_date)
      .select { |d| rt.recurrence_rule.applies?(d) }
      .map { |d| ScheduledTransaction.new(d, rt.name, rt.amount) }
  end
end
