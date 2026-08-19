type Props = {
  items: { label: string; value: React.ReactNode }[];
};

export function DescriptionList({ items }: Props) {
  return (
    <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 break-words whitespace-pre-wrap">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
