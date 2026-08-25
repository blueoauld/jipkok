import Image from "next/image";

type Props = {
  urls: string[];
  emptyMessage: string;
};

export function PhotoGrid({ urls, emptyMessage }: Props) {
  if (urls.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((url, index) => (
        <a key={index} href={url} target="_blank" rel="noreferrer">
          <Image
            src={url}
            alt=""
            width={320}
            height={320}
            className="aspect-square w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
