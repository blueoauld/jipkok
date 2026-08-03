const REQUEST_ID_HEADER = "X-Request-Id";

let lastFailedRequestId: string | null = null;

export function rememberFailedRequestId(response: Response) {
  lastFailedRequestId = response.headers.get(REQUEST_ID_HEADER);
}

export function getLastFailedRequestId() {
  return lastFailedRequestId;
}
