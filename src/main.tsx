import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
import { RouterProvider } from "react-router-dom";
import Router from "./Routes/routes.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <App /> */}
    <RouterProvider router={Router} />
  </React.StrictMode>
);
