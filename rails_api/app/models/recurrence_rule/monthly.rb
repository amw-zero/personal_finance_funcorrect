module RecurrenceRule
  class Monthly
    attr_reader :day

    def initialize(day:)
      @day = day
    end

    def self.from_attrs(attrs)
      Monthly.new(day: attrs['day'].to_i)
    end

    def applies?(date)
      day == date.day
    end

    def recurrence_type
      'monthly'
    end

    def inspect
      "monthly:day=#{day}"
    end

    def to_h
      {
        day: @day
      }
    end

    def db_serialize
      to_h
    end
  end
end