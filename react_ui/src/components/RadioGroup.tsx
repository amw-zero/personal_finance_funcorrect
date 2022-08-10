import { FC, useState } from "react";

export interface RadioGroupOption {
  name: string;
  label: string;
}

interface Props {
  options: RadioGroupOption[]
  onSelectOption?: (o: RadioGroupOption) => void;
}
export const RadioGroup: FC<Props> = ({ options, onSelectOption }) => {
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const onOptionChange = (o: RadioGroupOption) => {
    setSelectedOption(o);
    onSelectOption && onSelectOption(o);
  };

  return (
    <>
      {options.map(option => {
        return (
          <span key={option.name} className="mr-2">
            <label className="radio">
            <input type="radio" name={option.name} onChange={() => onOptionChange(option)} checked={option.name === selectedOption.name} />
              {option.label}
            </label>
          </span>
        );
      })}
    </>
  );
};