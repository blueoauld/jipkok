type Props = {
  message: string;
};

export function EmptyState({ message }: Props) {
  return (
    <div className="flex h-48 items-center justify-center border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}
