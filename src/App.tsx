// import { useState } from "react";
import "./App.scss";
import { Outlet } from "react-router-dom";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <div className="w-screen h-[100dvh]">
      {/* <Toast ref={myToast} /> */}
      <Outlet />
    </div>
  );
}

export default App;
