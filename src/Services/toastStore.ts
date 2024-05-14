// toastStore.ts
import { create } from "zustand";
import { RefObject } from "react";
import { Toast } from "primereact/toast";

interface ToastState {
  toastRef: RefObject<Toast>;
  setToastRef: (ref: RefObject<Toast>) => void;
  showToast: (
    severity: "success" | "info" | "warn" | "error" | undefined,
    summary: string,
    detail: string,
    life?: number
  ) => void;
}

const useToastStore = create<ToastState>((set, get) => ({
  toastRef: { current: null },
  setToastRef: (ref: RefObject<Toast>) => set({ toastRef: ref }),
  showToast: (severity, summary, detail, life = 2000) => {
    const toast = get().toastRef.current;
    if (toast) {
      toast.show({ severity, summary, detail, life });
    }
  },
}));

export default useToastStore;
