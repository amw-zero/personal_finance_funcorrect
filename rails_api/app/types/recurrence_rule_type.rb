# Recurrence rules are stored as a string with format:
#   '<type>::attr1=v1;attr2=v2;...'
#
# The type represents the different rule types, e.g. Monthly and Weekly,
# and the list of attribute keys and values represent the data for each
# rule type.

class RecurrenceRuleType < ActiveRecord::Type::Value
  def resolve_rrule_type(type_str)
    case type_str
    when 'monthly'
      RecurrenceRule::Monthly
    when 'weekly'
      RecurrenceRule::Weekly
    else
      raise "Attempted to cast unknown recurrence rule type: #{type}"
    end
  end

  def cast(value)
    if value.is_a?(String) && value =~ /^weekly|monthly:/ 
      value_components = value.split('::')

      if value_components.length != 2
        raise "Recurrence rule DB strings must be of the format ''<type>:attr1=v1;attr2=v2;...'. Attempted to cast a string with #{value_components.length} components: #{value}" 
      end

      type, all_attrs = value_components

      attr_pairs = all_attrs.split(';')
      attrs = attr_pairs.each_with_object({}) do |attr_pair, attrs|
        k, v = attr_pair.split('=')
        if !v.nil?
          attrs[k] = v
        end
      end

      super(resolve_rrule_type(type).from_attrs(attrs))
    elsif value.is_a?(ActiveSupport::HashWithIndifferentAccess)
      attrs = value.except(:recurrence_type)

      super(resolve_rrule_type(value[:recurrence_type]).from_attrs(attrs))
    else
      super
    end
  end

  def serialize(value)
    if value.is_a?(RecurrenceRule::Monthly) || value.is_a?(RecurrenceRule::Weekly)
      attrs = value.db_serialize.to_a.map { |k, v| "#{k}=#{v}" }.join(";")
      case value
      when RecurrenceRule::Monthly
        super("monthly::#{attrs}")
      when RecurrenceRule::Weekly
        super("weekly::#{attrs}")
      end
    else
      super
    end
  end
end