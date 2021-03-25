import * as React from "react";
import { render } from "react-dom";

import Fsgs from "./containers/fsgs";

// import './index.css';
// import './initialize';

import defaultConfig from "./configs/config";

render(
  <Fsgs
    config={{
      ...defaultConfig,
      configVersion: "3.5",
      title: "FSGS",
    }}
  />,
  document.getElementById("root")
);
