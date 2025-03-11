import React from "react";
import { Dialog } from "primereact/dialog";

const SettingsMenu = ({
  showSettingsMenu,
  setShowSettingsMenu,
}: {
  showSettingsMenu: boolean;
  setShowSettingsMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Dialog
      visible={showSettingsMenu}
      onHide={() => setShowSettingsMenu(false)}
      dismissableMask={true}
      draggable={false}
      resizable={false}
      className="w-full sm:w-2/3 mdl:w-1/2 2xl:w-1/3 h-full sm:h-2/3"
      headerClassName="pb-0 bg-color2"
      header={<h2 className="font-heading text-color5 font-normal">Settings Menu</h2>}
      contentClassName="p-2 sm:p-3 mdl:p-4 bg-color2"
      closeIcon={<span className="pi pi-times text-color5"></span>}
    >
      <div className="w-full h-full p-2 rounded-md bg-color3">Coming Soon</div>
    </Dialog>
  );
};

export default SettingsMenu;
