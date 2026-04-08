// SVG icons for each resource type
export default function ResourceIcon({ icon, size = 18, color = 'currentColor' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (icon) {
    case 'enlarger':
      return (
        <svg {...props}>
          {/* Simplified enlarger: lens + column + base */}
          <circle cx="12" cy="8" r="3" />
          <line x1="12" y1="11" x2="12" y2="19" />
          <line x1="8" y1="19" x2="16" y2="19" />
          <line x1="12" y1="5" x2="12" y2="2" />
          <line x1="9" y1="2" x2="15" y2="2" />
          {/* Light rays */}
          <line x1="9" y1="13" x2="7" y2="21" opacity="0.5" />
          <line x1="15" y1="13" x2="17" y2="21" opacity="0.5" />
        </svg>
      );
    case 'film':
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <line x1="2" y1="9" x2="5" y2="9" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="2" y1="15" x2="5" y2="15" />
          <line x1="19" y1="9" x2="22" y2="9" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="19" y1="15" x2="22" y2="15" />
        </svg>
      );
    case 'scanner':
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="6" y1="8" x2="18" y2="8" />
          <line x1="6" y1="12" x2="14" y2="12" />
          <line x1="6" y1="16" x2="10" y2="16" />
        </svg>
      );
    case 'spool':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="3" x2="12" y2="9" />
          <line x1="12" y1="15" x2="12" y2="21" />
          <line x1="3" y1="12" x2="9" y2="12" />
          <line x1="15" y1="12" x2="21" y2="12" />
        </svg>
      );
    case 'iron':
      return (
        <svg {...props}>
          <path d="M4 14 Q4 10 8 10 L20 10 L20 14 Q20 18 4 18 Z" />
          <line x1="12" y1="10" x2="12" y2="6" />
          <path d="M10 6 L14 6" />
        </svg>
      );
    case 'camera':
    default:
      return (
        <svg {...props}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
  }
}
