const IcBagSimple = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8h12l1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

const IcBolt = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2 3 14h7l-1 8 11-14h-8l1-6Z" />
  </svg>
);

export const IcChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

export function UberEatsButton({ href = "https://www.ubereats.com/au/store/bagel-days/TODO", full }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`delivery-btn delivery-btn-ubereats${full ? " btn-block" : ""}`}
    >
      <IcBagSimple />
      <span>Uber <strong>Eats</strong></span>
      <IcChevron />
    </a>
  );
}

export function DoorDashButton({ href = "https://www.doordash.com/store/bagel-days-TODO", full }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`delivery-btn delivery-btn-doordash${full ? " btn-block" : ""}`}
    >
      <IcBolt />
      <span>DoorDash</span>
      <IcChevron />
    </a>
  );
}
