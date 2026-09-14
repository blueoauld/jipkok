const MAX_LONG_SIDE = 1280;
const WEBP_QUALITY = 0.8;
const WEBP_TYPE = "image/webp";

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    image.src = url;
  });
}

export async function toWebp(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_LONG_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 변환하지 못했습니다.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("이미지를 변환하지 못했습니다.")),
      WEBP_TYPE,
      WEBP_QUALITY,
    );
  });
}

export async function putToStorage(uploadUrl: string, blob: Blob) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": blob.type },
    body: blob,
  });
  if (!response.ok) throw new Error("사진을 올리지 못했습니다.");
}

export const uploadContentType = WEBP_TYPE;
