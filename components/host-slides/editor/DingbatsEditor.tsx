"use client";

import Image from "next/image";
import type { ClipboardEvent, DragEvent } from "react";
import { FaImage, FaTrash } from "react-icons/fa";
import type {
  HostDingbatItem,
  HostDingbatSet,
} from "@/src/host-slides/types";
import { getImageFileFromDataTransfer } from "@/src/host-slides/browserImageFiles";

type DingbatsEditorProps = {
  dingbats: HostDingbatSet;
  onChange: (dingbats: HostDingbatSet) => void;
  onImageFileSelected: (position: number, file: File) => void;
  onImageRemoved: (position: number) => void;
};

export function DingbatsEditor({
  dingbats,
  onChange,
  onImageFileSelected,
  onImageRemoved,
}: DingbatsEditorProps) {
  function updateItem(position: number, nextItem: HostDingbatItem) {
    const next = structuredClone(dingbats);
    const index = next.items.findIndex((item) => item.position === position);
    if (index >= 0) next.items[index] = nextItem;
    onChange(next);
  }

  function attachImage(item: HostDingbatItem, file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageFileSelected(item.position, file);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      updateItem(item.position, { ...item, imageUrl: reader.result });
    });
    reader.readAsDataURL(file);
  }

  function removeImage(item: HostDingbatItem) {
    const next = structuredClone(item);
    delete next.imageUrl;
    delete next.imageStoragePath;
    onImageRemoved(item.position);
    updateItem(item.position, next);
  }

  function pasteImage(
    event: ClipboardEvent<HTMLElement>,
    item: HostDingbatItem,
  ) {
    const file = getImageFileFromDataTransfer(event.clipboardData);
    if (!file) return;
    event.preventDefault();
    attachImage(item, file);
  }

  function dropImage(event: DragEvent<HTMLElement>, item: HostDingbatItem) {
    event.preventDefault();
    const file = getImageFileFromDataTransfer(event.dataTransfer);
    if (file) attachImage(item, file);
  }

  return (
    <section className="qhl-card space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Dingbats</h2>
        <p className="text-sm text-violet-100/70">
          Six Saturday Dingbat images and their answers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dingbats.items.map((item) => (
          <article
            key={item.position}
            className="space-y-3 rounded-xl border border-violet-200/25 bg-white/95 p-4 outline-none focus:ring-4 focus:ring-yellow-300/50"
            tabIndex={0}
            onPaste={(event) => pasteImage(event, item)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => dropImage(event, item)}
            aria-label={`Image attachment area for Dingbat ${item.position}`}
          >
            <h3 className="font-bold text-slate-900">
              Dingbat {item.position}
            </h3>
            <div className="relative h-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={`Dingbat ${item.position}`}
                  fill
                  sizes="320px"
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center border-2 border-dashed border-slate-300 text-sm text-slate-500">
                  Image missing
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Click this slot and paste an image, drag one here, or use the button.
            </p>

            <div className="flex flex-wrap gap-2">
              <input
                id={`dingbat-image-${item.position}`}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) attachImage(item, file);
                  event.target.value = "";
                }}
              />
              <label
                htmlFor={`dingbat-image-${item.position}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <FaImage />
                {item.imageUrl || item.imageStoragePath
                  ? "Replace Image"
                  : "Attach Image"}
              </label>
              {item.imageUrl || item.imageStoragePath ? (
                <button
                  type="button"
                  onClick={() => removeImage(item)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <FaTrash /> Remove Image
                </button>
              ) : null}
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">
                Answer
              </span>
              <input
                value={item.answer}
                onChange={(event) =>
                  updateItem(item.position, {
                    ...item,
                    answer: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:ring-4 focus:ring-violet-200"
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
