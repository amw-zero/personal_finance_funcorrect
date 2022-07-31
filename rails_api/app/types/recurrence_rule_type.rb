# Recurrence rules are stored as a string with format:
#   '<type>:attr1=v1;attr2=v2;...'
#
# The type represents the different rule types, e.g. Monthly and Weekly,
# and the list of attribute keys and values represent the data for each
# rule type.

class RecurrenceRuleType < ActiveRecord::Type::Value
  def cast(value)
    if value.is_a?(String) && value =~ /^weekly|monthly:/ 
      value_components = value.split(':')

      if value_components.length != 2
        raise "Recurrence rule DB strings must be of the format ''<type>:attr1=v1;attr2=v2;...'. Attempted to cast a string with #{value_components.length} components: #{value}" 
      end

      type, all_attrs = value_components

      attr_pairs = all_attrs.split(';')
      attrs = attr_pairs.each_with_object({}) do |attr_pair, attrs|
        k, v = attr_pair.split('=')
        attrs[k] = v.to_i
      end

      recurrence_type = 
        case type
        when 'monthly'
          RecurrenceRule::Monthly
        when 'weekly'
          RecurrenceRule::Weekly
        else
          raise "Attempted to cast unknown recurrence rule type: #{type}"
        end
    
      super(recurrence_type.new(attrs))
    elsif value.is_a?(ActiveSupport::HashWithIndifferentAccess)
      recurrence_type = 
        case value[:recurrenceType]
        when 'monthly'
          RecurrenceRule::Monthly
        when 'weekly'
          RecurrenceRule::Weekly
        else
          raise "Attempted to cast unknown recurrence rule type: #{value[:recurrenceType]}"
        end

      attrs = value.except(:recurrenceType)

      super(recurrence_type.new(attrs))
    else
      super
    end
  end

  def serialize(value)
    if value.is_a?(RecurrenceRule::Monthly) || value.is_a?(RecurrenceRule::Weekly)
      attrs = value.to_h.to_a.map { |k, v| "#{k}=#{v}" }.join(";")
      case value
      when RecurrenceRule::Monthly
        super("monthly:#{attrs}")
      when RecurrenceRule::Weekly
        super("weekly:#{attrs}")
      end
    else
      super
    end
  end
end