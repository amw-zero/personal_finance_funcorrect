import { FC} from "react";

interface Props {
    children: React.ReactNode | React.ReactNode[]
}

export const Container: FC<Props> = ({ children }) => (
  <div className="columns is-centered">
    <div className="column">
      {children}
    </div>
  </div>
);