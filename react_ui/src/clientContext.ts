import { Client } from './state';
import {createContext} from "react"

export const ClientContext = createContext<Client>(new Client());
