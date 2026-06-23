export function getImageFileFromDataTransfer(
  dataTransfer: DataTransfer,
): File | null {
  for (const item of Array.from(dataTransfer.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  return (
    Array.from(dataTransfer.files).find((file) =>
      file.type.startsWith("image/"),
    ) ?? null
  );
}
