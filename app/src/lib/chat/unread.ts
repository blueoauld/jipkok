const MAX_UNREAD_COUNT = 99;

export function formatUnreadCount(count: number) {
  return count > MAX_UNREAD_COUNT ? `${MAX_UNREAD_COUNT}+` : `${count}`;
}
