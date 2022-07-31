class RecurringTransaction < ApplicationRecord
    attribute :recurrence_rule, RecurrenceRuleType.new
end