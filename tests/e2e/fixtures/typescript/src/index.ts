export function canPublish(isOwner: boolean, isReady: boolean): boolean {
  if (isOwner && isReady) {
    return true;
  }
  return false;
}
