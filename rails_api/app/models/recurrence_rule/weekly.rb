module RecurrenceRule
  class Weekly
    attr_reader :interval, :day, :basis

    def initialize(interval:, day:, basis:)
      @interval = interval
      @day = day
      @basis = basis
    end

    def self.from_attrs(attrs)
      interval = attrs['interval'].to_i if !attrs['interval'].nil?
      day = attrs['day'].to_i
      basis = Date.parse(attrs['basis']) if !attrs['basis'].nil?

      Weekly.new(interval: interval, day: day, basis: basis)
    end

    def applies?(date)
      puts "Checking if weekly rrule applies: #{date} | #{to_h}"
      if interval && basis
        day_delta = (date - basis).to_f.floor
        puts "interval + basis, returning #{(day_delta / 7.0) % interval == 0}. Day delta was #{day_delta}, Num weeks: #{day_delta / 7.0}, Weeks interval mod: #{(day_delta / 7.0) % interval}"
        return (day_delta / 7.0) % interval == 0
      end

      if interval|| basis
        puts "Missing one of interval or basis, returning false"
        return false
      end

      puts "Returning day == weekday, #{day == date.wday}"
      day == date.wday
    end

    def recurrence_type
      'weekly'
    end

    def inspect
      "weekly:day=#{day};basis=#{basis};interval=#{interval}"
    end

    def to_h
      {
        interval: @interval,
        day: @day,
        basis: @basis,
      }
    end

    def db_serialize
      to_h.merge({
        basis: basis&.strftime('%Y-%m-%dT%H:%M:%S.%NZ')
      })
    end
  end
end