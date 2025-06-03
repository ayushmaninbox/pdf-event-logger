// Real-world event log examples with more activities
const events = [
  "Document created by Sarah Chen (sarah.chen@cloudbyz.com)",
  "Document emailed to David Miller (david.m@cloudbyz.com) for signature",
  "Document viewed by David Miller (david.m@cloudbyz.com)",
  "David Miller (david.m@cloudbyz.com) entered valid password",
  "Document e-signed by David Miller (david.m@cloudbyz.com)",
  "Signed document emailed to Sarah Chen (sarah.chen@cloudbyz.com)",
  "Document viewed by Sarah Chen (sarah.chen@cloudbyz.com)",
  "Sarah Chen (sarah.chen@cloudbyz.com) approved the document",
  "Document routed to Legal Department for review",
  "Document viewed by John Smith (john.s@cloudbyz.com) from Legal",
  "Legal review completed by John Smith (john.s@cloudbyz.com)",
  "Document sent to Finance Department for processing",
  "Document viewed by Emily Wong (emily.w@cloudbyz.com) from Finance",
  "Payment terms verified by Finance Department",
  "Document archived in compliance repository"
];

export function getEvents() {
  return events;
}