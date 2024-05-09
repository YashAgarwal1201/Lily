// import { useState } from "react";
import "./App.scss";
import { Outlet } from "react-router-dom";
import Layout from "./Layout/Layout";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <div className="w-screen h-[100dvh]">
      {/* <Toast ref={myToast} /> */}
      <Layout>
        <Outlet />
      </Layout>
    </div>
  );
}

export default App;
