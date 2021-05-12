export function newEvent(eventType, payload) {
  return {
    eventType: eventType,
    payload: payload,
  };
}
