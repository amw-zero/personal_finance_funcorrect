module RecurrenceRule
  Weekly = Struct.new(:interval, :day, :basis, keyword_init: true) do
    def applies?(date)
      day == date.wday
    end

    def inspect
      "weekly:day=#{day};basis=#{basis}"
    end
  end
end