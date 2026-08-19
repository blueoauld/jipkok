type Props = {
  id: number;
  nickname: string;
};

export function MemberCell({ id, nickname }: Props) {
  return (
    <span>
      {nickname}
      <span className="ml-1 tabular-nums text-muted-foreground">#{id}</span>
    </span>
  );
}
