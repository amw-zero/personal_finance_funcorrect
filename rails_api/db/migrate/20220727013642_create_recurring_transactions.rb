class CreateRecurringTransactions < ActiveRecord::Migration[7.0]
  def change
    create_table :recurring_transactions do |t|
      t.string :name
      t.string :recurrence_rule
      t.numeric :amount, precision: 10
      t.timestamps
    end
  end
end
