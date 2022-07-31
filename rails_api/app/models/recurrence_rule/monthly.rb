module RecurrenceRule
  Monthly = Struct.new(:day, keyword_init: true) do
    def applies?(date)
      day == date.day
    end

    def inspect
      "monthly:day=#{day}"
    end
  end
end