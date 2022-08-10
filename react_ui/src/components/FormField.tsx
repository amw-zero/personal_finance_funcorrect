import { FC} from "react";

interface Props {
    children: React.ReactNode | React.ReactNode[]
}

export const FormField: FC<Props> = ({ children }) => (
  <div className="field">
    <div className="control">
      {children}
    </div>
  </div>
);