// reactjs/src/Components/SettingsMenu/SettingsMenu.tsx
import React from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Slider } from "primereact/slider";
import useMessageStore from "../../Services/messageStore";
import { AVAILABLE_MODELS } from "../../Services/constants";

const SettingsMenu = ({
  showSettingsMenu,
  setShowSettingsMenu,
}: {
  showSettingsMenu: boolean;
  setShowSettingsMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { config, setConfig, gatewayOnline } = useMessageStore();

  const selectedModel =
    AVAILABLE_MODELS.find(
      (m) => m.model === config.model && m.provider === config.provider,
    ) ?? AVAILABLE_MODELS[0];

  return (
    <Dialog
      visible={showSettingsMenu}
      onHide={() => setShowSettingsMenu(false)}
      dismissableMask={true}
      draggable={false}
      resizable={false}
      className="w-full sm:w-2/3 mdl:w-1/2 2xl:w-1/3 h-full sm:h-2/3"
      headerClassName="pb-0 bg-color2"
      header={
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-color5 font-normal">Settings</h2>
          {/* Gateway status pill */}
          <span
            className={`text-xs font-subheading px-2 py-0.5 rounded-full ${
              gatewayOnline
                ? "bg-color4 text-color5"
                : "bg-color1 text-color2 opacity-60"
            }`}
          >
            {gatewayOnline ? "● Gateway Online" : "○ Gateway Offline"}
          </span>
        </div>
      }
      contentClassName="p-2 sm:p-3 mdl:p-4 bg-color2"
      closeIcon={<span className="pi pi-times text-color5"></span>}
    >
      <div className="w-full h-full p-3 rounded-md bg-color3 flex flex-col gap-4">
        {/* Model selector */}
        <div className="flex flex-col gap-1">
          <label className="font-subheading text-sm text-color5">Model</label>
          <Dropdown
            value={selectedModel}
            options={AVAILABLE_MODELS}
            onChange={(e) =>
              setConfig({ provider: e.value.provider, model: e.value.model })
            }
            optionLabel="label"
            className="w-full bg-color2 border-color1"
            panelClassName="bg-color2"
          />
          <small className="font-subheading text-color1 opacity-70">
            Provider: {config.provider}
          </small>
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-2">
          <label className="font-subheading text-sm text-color5">
            Temperature —{" "}
            <span className="text-color1">{config.temperature.toFixed(1)}</span>
          </label>
          <Slider
            value={config.temperature * 10}
            onChange={(e) =>
              setConfig({ temperature: (e.value as number) / 10 })
            }
            min={0}
            max={20}
            className="w-full"
          />
          <div className="flex justify-between">
            <small className="font-subheading text-color1 opacity-60">
              Precise (0.0)
            </small>
            <small className="font-subheading text-color1 opacity-60">
              Creative (2.0)
            </small>
          </div>
        </div>

        {/* Max tokens */}
        <div className="flex flex-col gap-1">
          <label className="font-subheading text-sm text-color5">
            Max Tokens —{" "}
            <span className="text-color1">{config.max_tokens}</span>
          </label>
          <Slider
            value={config.max_tokens}
            onChange={(e) => setConfig({ max_tokens: e.value as number })}
            min={256}
            max={4096}
            step={256}
            className="w-full"
          />
        </div>
      </div>
    </Dialog>
  );
};

export default SettingsMenu;
