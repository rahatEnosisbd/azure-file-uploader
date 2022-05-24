import * as React from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "./Home";

export function App():React.ReactElement {
  return (
    <div>
      <h1>Welcome to Simple file upload app!</h1>
      <Home/>
    </div>
  );
}
