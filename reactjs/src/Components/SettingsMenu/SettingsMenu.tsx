// reactjs/src/Components/SettingsMenu/SettingsMenu.tsx
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Slider } from "primereact/slider";
import { Button } from "primereact/button";
import useMessageStore from "../../Services/messageStore";
import { AVAILABLE_MODELS } from "../../Services/constants";
import { fetchDocs, deleteDoc, ingestFiles } from "../../Services/tulipApi";
import type { RagDoc } from "../../Services/interfacesAndTypes";
import useToastStore from "../../Services/toastStore";

const RAG_MODES = [
  {
    value: "off",
    label: "Off",
    description: "Never search documents",
  },
  {
    value: "ask",
    label: "Ask",
    description: "Show relevant sections, you confirm",
  },
  {
    value: "auto",
    label: "Auto",
    description: "Silently inject context when found",
  },
];

const SettingsMenu = ({
  showSettingsMenu,
  setShowSettingsMenu,
}: {
  showSettingsMenu: boolean;
  setShowSettingsMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { config, setConfig, gatewayOnline } = useMessageStore();
  const showToast = useToastStore((s) => s.showToast);

  const [docs, setDocs] = useState<RagDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedModel =
    AVAILABLE_MODELS.find(
      (m) => m.model === config.model && m.provider === config.provider,
    ) ?? AVAILABLE_MODELS[0];

  // Load docs when dialog opens
  useEffect(() => {
    if (showSettingsMenu) loadDocs();
  }, [showSettingsMenu]);

  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const data = await fetchDocs();
      setDocs(data);
    } catch {
      // Gateway offline or no docs — fail silently, show empty state
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      await deleteDoc(docId);
      setDocs((prev) => prev.filter((d) => d.doc_id !== docId));
      showToast("success", "Removed", "Document removed from knowledge base");
    } catch (err: any) {
      showToast("error", "Error", err.message ?? "Failed to remove document");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const result = await ingestFiles(files);

      if (result.total_ingested > 0) {
        showToast(
          "success",
          "Uploaded",
          `${result.total_ingested} file${result.total_ingested !== 1 ? "s" : ""} added to knowledge base`,
        );
        await loadDocs(); // refresh the list
      }

      if (result.total_errors > 0) {
        result.errors.forEach((e) =>
          showToast("warn", `Skipped: ${e.file}`, e.error),
        );
      }
    } catch (err: any) {
      showToast("error", "Upload Failed", err.message ?? "Unknown error");
    } finally {
      setUploading(false);
      // Reset input so uploading the same file again triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      visible={showSettingsMenu}
      onHide={() => setShowSettingsMenu(false)}
      dismissableMask={true}
      draggable={false}
      resizable={false}
      className="w-full sm:w-2/3 mdl:w-1/2 2xl:w-1/3 h-full sm:h-auto"
      headerClassName="pb-0 bg-color2"
      header={
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-color5 font-normal">Settings</h2>
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

        {/* RAG mode */}
        <div className="flex flex-col gap-2">
          <label className="font-subheading text-sm text-color5">
            Document Mode
          </label>
          <div className="flex gap-2">
            {RAG_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() =>
                  setConfig({ ragMode: mode.value as "off" | "ask" | "auto" })
                }
                className={`flex-1 py-1.5 px-2 rounded font-subheading text-xs transition-colors ${
                  config.ragMode === mode.value
                    ? "bg-color1 text-color2"
                    : "bg-color2 text-color5 opacity-70"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <small className="font-subheading text-color1 opacity-60">
            {RAG_MODES.find((m) => m.value === config.ragMode)?.description}
          </small>
        </div>

        {/* Documents */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-subheading text-sm text-color5">
              Documents
            </label>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.docx,.xlsx,.csv,.pptx"
                onChange={handleFileUpload}
                className="hidden"
                id="rag-file-input"
              />
              <label htmlFor="rag-file-input">
                <Button
                  icon={uploading ? "pi pi-spinner pi-spin" : "pi pi-upload"}
                  size="small"
                  disabled={uploading || !gatewayOnline}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-color1 text-color2 font-subheading text-xs px-2 py-1 rounded"
                  label={uploading ? "Uploading..." : "Upload"}
                />
              </label>
            </div>
          </div>

          {/* Doc list */}
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {docsLoading ? (
              <div className="flex items-center gap-2 py-2">
                <i className="pi pi-spinner pi-spin text-color1 text-xs" />
                <small className="font-subheading text-color1 opacity-60">
                  Loading...
                </small>
              </div>
            ) : docs.length === 0 ? (
              <div className="py-3 text-center">
                <i className="pi pi-folder-open text-color1 opacity-40 text-lg block mb-1" />
                <small className="font-subheading text-color1 opacity-50">
                  No documents uploaded yet
                </small>
              </div>
            ) : (
              docs.map((doc) => (
                <div
                  key={doc.doc_id}
                  className="flex items-center justify-between bg-color2 rounded px-2 py-1.5"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-subheading text-xs text-color5 truncate">
                      {doc.source}
                    </span>
                    <small className="font-subheading text-color1 opacity-50">
                      {doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""}
                    </small>
                  </div>
                  <Button
                    icon={
                      deletingId === doc.doc_id
                        ? "pi pi-spinner pi-spin"
                        : "pi pi-trash"
                    }
                    size="small"
                    disabled={deletingId === doc.doc_id}
                    onClick={() => handleDelete(doc.doc_id)}
                    className="text-color1 opacity-60 hover:opacity-100 p-1 ml-2 shrink-0"
                  />
                </div>
              ))
            )}
          </div>
          <small className="font-subheading text-color1 opacity-40">
            Supported: PDF, DOCX, PPTX, XLSX, TXT, MD, CSV
          </small>
        </div>
      </div>
    </Dialog>
  );
};

export default SettingsMenu;
