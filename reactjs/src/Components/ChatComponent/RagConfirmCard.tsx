// reactjs/src/Components/ChatComponent/RagConfirmCard.tsx
import { Button } from "primereact/button";
import type { RagChunk } from "../../Services/interfacesAndTypes";

interface RagConfirmCardProps {
  chunks: RagChunk[];
  onConfirm: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

const MAX_VISIBLE_CHUNKS = 3;

const RagConfirmCard = ({
  chunks,
  onConfirm,
  onSkip,
  isLoading,
}: RagConfirmCardProps) => {
  const visible = chunks.slice(0, MAX_VISIBLE_CHUNKS);
  const overflow = chunks.length - MAX_VISIBLE_CHUNKS;

  return (
    <div className="w-full flex flex-row gap-x-2 my-1">
      {/* Same avatar column spacing as bot messages */}
      <div className="w-10 h-10 shrink-0" />

      <div className="flex-1 bg-color2 rounded-r-md rounded-bl-md p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <i className="pi pi-file text-color1 text-sm" />
          <span className="font-subheading text-sm text-color5">
            Found {chunks.length} relevant section
            {chunks.length !== 1 ? "s" : ""} in your documents
          </span>
        </div>

        {/* Chunk previews — max 3, hint if more */}
        <div className="flex flex-col gap-1">
          {visible.map((chunk, i) => (
            <div
              key={i}
              className="bg-color3 rounded p-2 flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <small className="font-subheading text-color1 truncate max-w-[70%]">
                  {chunk.source}
                </small>
                <small className="font-subheading text-color1 opacity-60">
                  {Math.round(chunk.score * 100)}% match
                </small>
              </div>
              <p className="font-content text-xs text-color5 opacity-70 line-clamp-2">
                {chunk.preview}
              </p>
            </div>
          ))}
          {overflow > 0 && (
            <small className="font-subheading text-color1 opacity-40 pl-1">
              +{overflow} more section{overflow !== 1 ? "s" : ""}
            </small>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <Button
            label="Use my docs"
            icon="pi pi-check"
            size="small"
            disabled={isLoading}
            onClick={onConfirm}
            className="bg-color1 text-color2 font-subheading text-xs px-3 py-1.5 rounded"
          />
          <Button
            label="Skip"
            icon="pi pi-times"
            size="small"
            disabled={isLoading}
            onClick={onSkip}
            className="bg-color3 text-color5 font-subheading text-xs px-3 py-1.5 rounded border border-color1 border-opacity-30"
          />
        </div>
      </div>
    </div>
  );
};

export default RagConfirmCard;
