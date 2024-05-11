import React, { ReactNode } from "react";
import Header from "../Components/Header/Header";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-full flex bg-color2">
      <div className="w-[70px] h-full">
        <Header />
      </div>
      <div className="w-[calc(100%-70px)] h-full ps-1 pe-2 py-2">{children}</div>
    </div>
  );
};

export default Layout;
