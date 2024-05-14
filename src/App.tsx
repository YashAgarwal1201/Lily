// import { useState } from "react";
import "./App.scss";
import { Outlet } from "react-router-dom";
import Layout from "./Layout/Layout";
import { Toast } from "primereact/toast";
import { useRef, useEffect } from "react";
import useToastStore from "./Services/toastStore";

function App() {
  // const [count, setCount] = useState(0);
  const toastRef = useRef<Toast>(null);
  const setToastRef = useToastStore((state) => state.setToastRef);

  useEffect(() => {
    setToastRef(toastRef);
  }, [setToastRef]);

  return (
    <div className="w-screen h-[100dvh]">
      <Toast ref={toastRef} />
      <Layout>
        <Outlet />
      </Layout>
    </div>
  );
}

export default App;
