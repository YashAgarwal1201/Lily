import type { ToastSeverity } from "@/types/types";
import { useToast } from "primevue/usetoast";

const toastHandler = () => {
  const toast = useToast();

  return {
    showToast: (
      severity: ToastSeverity,
      summary: string,
      detail: string,
      life: number = 2000
    ): void => {
      toast.add({ severity, summary, detail, life });
    },
  };
};

export default toastHandler;
