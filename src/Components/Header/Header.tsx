import React, { startTransition } from "react";
import { Button } from "primereact/button";
import { useLocation, useNavigate } from "react-router-dom";
import useMessageStore from "../../Services/messageStore";
import { downloadMessages } from "../../Services/common-functions";
import useToastStore from "../../Services/toastStore";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { messages, clearMessages } = useMessageStore();
  const showToast = useToastStore((state) => state.showToast);

  const headerBtnStyles =
    "w-auto md:w-full h-full md:h-auto aspect-square text-color5 bg-color4 rounded-md";

  return (
    <div className="w-full h-full ps-2 py-2 pe-1 flex flex-row md:flex-col items-center justify-center gap-2">
      {/* <img src={"./logo.svg"} className={`${headerBtnStyles} bg-transparent justify-end`} /> */}
      {location.pathname === "/" ? (
        <>
          <Button
            title="Refresh chat"
            icon={"pi pi-refresh"}
            className={headerBtnStyles}
            onClick={() => clearMessages()}
          />
          <Button
            disabled={messages.length < 1}
            title="Download conversation"
            icon={"pi pi-download"}
            className={headerBtnStyles}
            onClick={() => {
              downloadMessages(messages);
              showToast("success", "Sucess", "File downloaded");
            }}
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
      {!location.pathname.includes("/feedback") && (
        <Button
          title="Give feedback"
          icon={"pi pi-comment"}
          className={headerBtnStyles}
          onClick={() => startTransition(() => navigate("/feedback"))}
        />
      )}
      <Button
        title="Settings menu"
        icon={"pi pi-cog"}
        className={headerBtnStyles}
      />
    </div>
  );
};

export default Header;
