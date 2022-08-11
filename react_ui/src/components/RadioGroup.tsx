import { Field } from "formik";
import React, { FC, useState } from "react";

export interface RadioGroupOption {
  name: string;
  label: string;
  value: string;  
}

interface Props {
  options: RadioGroupOption[];
  handleChange: (e: React.ChangeEvent<any>) => void;
  onSelectOption?: (o: RadioGroupOption) => void;
}
export const RadioGroup: FC<Props> = ({ options, onSelectOption, handleChange }) => {
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const onOptionChange = (o: RadioGroupOption) => {
    setSelectedOption(o);
    onSelectOption && onSelectOption(o);
  };

  const handleFormikChange = (e: React.ChangeEvent, o: RadioGroupOption) => {
    handleChange(e);
    onOptionChange(o)
  }

  return (
    <>
      {options.map(option => {
        return (
          <span key={option.value} className="mr-2">
            <label className="radio">
              {option.label}
            </label>
            <Field type="radio" name={option.name} onChange={(e: React.ChangeEvent) => handleFormikChange(e, option)} checked={option.value === selectedOption.value} value={option.value} />
            </span>
        );
      })}
    </>
  );
};