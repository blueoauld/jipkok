import Image from "next/image";
import { ImageOff } from "lucide-react";

type Props = {
  urls: (string | null)[];
  emptyMessage: string;
};

export function PhotoGrid({ urls, emptyMessage }: Props) {
  if (urls.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((url, index) =>
        url ? (
          <a key={index} href={url} target="_blank" rel="noreferrer">
            <Image
              src={url}
              alt=""
              width={320}
              height={320}
              className="aspect-square w-full object-cover"
            />
          </a>
        ) : (
          <div
            key={index}
            className="flex aspect-square items-center justify-center bg-neutral-200 text-muted-foreground dark:bg-neutral-800"
          >
            <ImageOff className="size-5" />
          </div>
        ),
      )}
    </div>
  );
}
