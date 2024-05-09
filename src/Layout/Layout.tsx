import React, { ReactNode } from "react";
import Header from "../Components/Header/Header";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-full flex">
      <div className="w-[70px] h-full border-2">
        <Header />
      </div>
      <div className="w-[calc(100%-70px)] h-full">{children}</div>
    </div>
  );
};

export default Layout;
