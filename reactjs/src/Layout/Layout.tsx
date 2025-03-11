import React, { ReactNode } from "react";
import Header from "../Components/Header/Header";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-color2">
      <div className="w-full md:w-[70px] h-[70px] md:h-full">
        <Header />
      </div>
      <div className="w-full md:w-[calc(100%-70px)] h-[calc(100%-70px)] md:h-full ps-1 pe-2 py-2">
        {children}
      </div>
    </div>
  );
};

export default Layout;
