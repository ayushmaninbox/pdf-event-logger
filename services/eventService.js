// Real-world event log examples
const events = [
  "Document created by Sarah Chen (sarah.chen@cloudbyz.com)",
  "Document emailed to David Miller (david.m@cloudbyz.com) for signature",
  "Document viewed by David Miller (david.m@cloudbyz.com)",
  "David Miller (david.m@cloudbyz.com) entered valid password",
  "Document e-signed by David Miller (david.m@cloudbyz.com)",
  "Signed document emailed to Sarah Chen (sarah.chen@cloudbyz.com)"
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