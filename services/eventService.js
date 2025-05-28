// Real-world event log examples
const events = [
  "Document created by Sarah Chen (sarah.chen@company.com)",
  "Document emailed to David Miller (david.m@company.com) for signature",
  "Document viewed by David Miller (david.m@company.com)",
  "David Miller (david.m@company.com) entered valid password",
  "Document e-signed by David Miller (david.m@company.com)",
  "Signed document emailed to Sarah Chen (sarah.chen@company.com)"
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