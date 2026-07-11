import { useEffect, useMemo, useState } from "react";
import { Folder, Save } from "lucide-react";
import type { Collection } from "@/types";
import { useCollectionStore } from "@/stores/collectionStore";

interface Props {
  open: boolean;
  initialName: string;
  onCancel: () => void;
  onConfirm: (name: string, collectionId: string) => void;
}

interface FlatOption {
  collection: Collection;
  depth: number;
}

function flatten(collections: Collection[], parentId: string | null, depth: number): FlatOption[] {
  const level = collections
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.position - b.position);
  return level.flatMap((c) => [{ collection: c, depth }, ...flatten(collections, c.id, depth + 1)]);
}

export function SaveRequestModal({ open, initialName, onCancel, onConfirm }: Props) {
  const { collections, load, loaded, createCollection } = useCollectionStore();
  const [name, setName] = useState(initialName);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (open && !loaded) load().catch(() => {});
  }, [open, loaded, load]);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const options = useMemo(() => flatten(collections, null, 0), [collections]);

  useEffect(() => {
    if (open && !collectionId && options.length > 0) setCollectionId(options[0].collection.id);
  }, [open, options, collectionId]);

  if (!open) return null;

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const created = await createCollection(trimmed, null);
    setCollectionId(created.id);
    setCreatingFolder(false);
    setNewFolderName("");
  };

  const canSave = name.trim().length > 0 && !!collectionId;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="w-[420px] rounded-lg border border-border bg-bg-panel p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-text-primary">
          <Save size={15} className="text-accent" /> Save Request
        </h3>

        <label className="mb-1 block text-[11px] uppercase tracking-wide text-text-muted">Request name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
        />

        <label className="mb-1 block text-[11px] uppercase tracking-wide text-text-muted">Save to collection</label>
        <div className="mb-2 max-h-[200px] overflow-y-auto rounded-md border border-border">
          {options.length === 0 ? (
            <div className="p-3 text-center text-[12px] text-text-muted">
              No collections yet — create one below.
            </div>
          ) : (
            options.map(({ collection, depth }) => (
              <button
                key={collection.id}
                onClick={() => setCollectionId(collection.id)}
                style={{ paddingLeft: 10 + depth * 16 }}
                className={`flex w-full items-center gap-2 py-1.5 pr-3 text-left text-[13px] ${
                  collectionId === collection.id
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary hover:bg-bg-hover"
                }`}
              >
                <Folder size={13} className="shrink-0" />
                <span className="truncate">{collection.name}</span>
              </button>
            ))
          )}
        </div>

        {creatingFolder ? (
          <div className="mb-3 flex gap-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="New collection name"
              className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
            />
            <button
              onClick={handleCreateFolder}
              className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:bg-accent-hover"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="mb-3 text-[12px] font-medium text-accent hover:text-accent-hover"
          >
            + New collection
          </button>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onConfirm(name.trim(), collectionId!)}
            disabled={!canSave}
            className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
