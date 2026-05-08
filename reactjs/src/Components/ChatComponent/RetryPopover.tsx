// reactjs/src/Components/ChatComponent/RetryPopover.tsx
import { useRef } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
// import { Button } from "primereact/button";
import { AVAILABLE_MODELS, ModelOption } from "../../Services/constants";

type Props = {
  currentModel: string;
  isLoading: boolean;
  onRetry: (model: ModelOption) => void;
};

const RetryPopover = ({ currentModel, isLoading, onRetry }: Props) => {
  const op = useRef<OverlayPanel>(null);

  return (
    <>
      <button
        type="button"
        title="Retry with a model"
        disabled={isLoading}
        onClick={(e) => op.current?.toggle(e)}
        className="retry-btn flex items-center gap-1 text-xs opacity-50 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
        aria-label="Retry response"
      >
        <i className="pi pi-refresh text-xs" />
        <span className="font-subheading">Retry</span>
      </button>

      <OverlayPanel
        ref={op}
        className="retry-popover"
        pt={{
          content: { className: "p-2" },
        }}
      >
        <p className="text-xs font-subheading opacity-60 mb-2 px-1">
          Retry with model
        </p>
        <ul className="flex flex-col gap-1 min-w-[160px]">
          {AVAILABLE_MODELS.map((m) => {
            const isActive = m.model === currentModel;
            return (
              <li key={m.model}>
                <button
                  type="button"
                  onClick={() => {
                    op.current?.hide();
                    onRetry(m);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm font-content flex items-center justify-between gap-3 transition-colors
                    ${
                      isActive
                        ? "bg-color1 text-color2"
                        : "hover:bg-color3 text-color5"
                    }`}
                >
                  <span>{m.label}</span>
                  {isActive && <i className="pi pi-check text-xs opacity-70" />}
                </button>
              </li>
            );
          })}
        </ul>
      </OverlayPanel>
    </>
  );
};

export default RetryPopover;
