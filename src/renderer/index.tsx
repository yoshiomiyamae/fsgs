import * as React from "react";
import { createRoot } from 'react-dom/client';
import Fsgs from "./containers/fsgs";

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Fsgs />);
