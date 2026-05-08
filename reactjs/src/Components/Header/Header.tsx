// reactjs/src/Components/Header/Header.tsx
import { startTransition, useState, useEffect } from "react";
import { Button } from "primereact/button";
import { useLocation, useNavigate } from "react-router-dom";
import useMessageStore from "../../Services/messageStore";
import { downloadMessages } from "../../Services/common-functions";
import useToastStore from "../../Services/toastStore";
import SettingsMenu from "../SettingsMenu/SettingsMenu";
import {
  healthCheck,
  fetchSessions,
  fetchSessionMessages,
} from "../../Services/tulipApi";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    messages,
    clearMessages,
    sessionId,
    setSessionId,
    sessions,
    setSessions,
    setGatewayOnline,
    loadSessionMessages,
  } = useMessageStore();
  const showToast = useToastStore((state) => state.showToast);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // Check gateway health on mount
  useEffect(() => {
    healthCheck().then(setGatewayOnline);
  }, []);

  // Refresh session list whenever the panel opens or a new session starts
  const handleLoadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch {
      showToast("error", "Error", "Could not load sessions");
    }
  };

  const handleSwitchSession = async (id: string) => {
    if (id === sessionId) return;
    try {
      const msgs = await fetchSessionMessages(id);
      loadSessionMessages(msgs);
      setSessionId(id);
      showToast("info", "Session", "Loaded session");
    } catch {
      showToast("error", "Error", "Could not load session");
    }
  };

  const headerBtnStyles: string =
    "w-auto md:w-full h-full md:h-auto aspect-square text-color5 bg-color4 rounded-md";

  return (
    <>
      <div className="w-full h-full ps-2 py-2 pe-1 flex flex-row md:flex-col items-center justify-center gap-2">
        {location.pathname === "/" ? (
          <>
            {/* New chat */}
            <Button
              title="New chat"
              icon={"pi pi-plus"}
              className={headerBtnStyles}
              onClick={() => {
                clearMessages();
                showToast("success", "New Chat", "Started a new conversation");
              }}
            />
            {/* Session history */}
            <Button
              title="Session history"
              icon={"pi pi-history"}
              className={headerBtnStyles}
              onClick={handleLoadSessions}
            />
            <Button
              disabled={messages.length < 1}
              title="Refresh / clear chat"
              icon={"pi pi-refresh"}
              className={headerBtnStyles}
              onClick={() => {
                clearMessages();
                showToast("success", "Success", "Messages cleared");
              }}
            />
            <Button
              disabled={messages.length < 1}
              title="Download conversation"
              icon={"pi pi-download"}
              className={headerBtnStyles}
              onClick={() => {
                downloadMessages(messages);
                showToast("success", "Success", "File downloaded");
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
          title="Settings"
          icon={"pi pi-cog"}
          className={headerBtnStyles}
          onClick={() => setShowSettingsMenu(true)}
        />
      </div>

      {/* Session list — simple inline dropdown under the history button */}
      {sessions.length > 0 && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80%] overflow-y-auto bg-color2 shadow-lg rounded-md flex flex-col gap-1">
          <div className="sticky top-0 bg-color2 flex justify-between items-center mb-1 p-2">
            <span className="font-subheading text-sm text-color5">
              Recent Sessions
            </span>
            <Button
              icon="pi pi-times"
              className="w-6 h-6 text-color5 bg-transparent"
              onClick={() => setSessions([])}
            />
          </div>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                handleSwitchSession(s.id);
                setSessions([]);
              }}
              className={`text-left text-sm font-content mx-2 px-2 py-1 rounded-md transition-colors ${
                s.id === sessionId
                  ? "bg-color4 text-color5"
                  : "bg-color3 text-color5 hover:bg-color4"
              }`}
            >
              <div className="truncate">{s.title ?? "Untitled session"}</div>
              <small className="text-color1 opacity-60">
                {new Date(s.updated_at).toLocaleString()}
              </small>
            </button>
          ))}
        </div>
      )}

      <SettingsMenu
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
      />
    </>
  );
};

export default Header;
