export const unauthorizedEventName = 'elevate:unauthorized';

export function notifyUnauthorized(): void {
  window.dispatchEvent(new Event(unauthorizedEventName));
}
