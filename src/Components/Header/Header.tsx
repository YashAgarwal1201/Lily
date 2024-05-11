import React, { startTransition } from "react";
import { Button } from "primereact/button";
import { useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const headerBtnStyles = "w-full h-auto aspect-square text-color5 bg-color4 rounded-md";
  return (
    <div className="w-full h-full ps-2 py-2 pe-1 flex flex-col items-center justify-center gap-2">
      {/* <img src={"./logo.svg"} className={`${headerBtnStyles} bg-transparent justify-end`} /> */}
      {location.pathname === "/" ? (
        <>
          <Button
            title="Refresh chat"
            icon={"pi pi-refresh"}
            className={headerBtnStyles}
          />
          <Button
            title="Download conversation"
            icon={"pi pi-download"}
            className={headerBtnStyles}
          />
        </>
      ) : (
        <Button
          title="Go back"
          icon={"pi pi-arrow-left"}
          className={headerBtnStyles}
          onClick={() => startTransition(() => navigate("/"))}
        />
      )}
      <Button
        title="Give feedback"
        icon={"pi pi-comment"}
        className={headerBtnStyles}
      />
      <Button
        title="Settings menu"
        icon={"pi pi-cog"}
        className={headerBtnStyles}
      />
    </div>
  );
};

export default Header;
