// Simple array to store events
const events = [
  "User 1 created doc",
  "User 2 opened doc",
  "User 2 signed doc",
  "User 3 reviewed doc",
  "User 1 updated doc",
  "Admin approved doc"
];

export function getEvents() {
  return events;
}

export function addEvent(event) {
  events.push(event);
  return events;
}

export function clearEvents() {
  events.length = 0;
  return events;
}