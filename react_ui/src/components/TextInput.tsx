import { FC } from "react";
import { Field } from 'formik';


interface Props {
  name: string;
  type: "text" | "number";
  label: string;
}

export const TextInput: FC<Props> = ({ name, type, label }) => {
  return (
    <>
      <label className="label">{label}</label>
      <Field className="input" name={name} type={type} />
    </>
  )
}