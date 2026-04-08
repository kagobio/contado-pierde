// ── Resource categories ────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'all',            label: 'Todas' },
  { id: 'enlarger_cabin', label: 'Cabinas' },
  { id: 'enlarger_post',  label: 'Puestos' },
  { id: 'large_format',   label: 'Gran Formato' },
  { id: 'film_develop',   label: 'Película' },
  { id: 'scanner',        label: 'Escáner' },
  { id: 'other',          label: 'Otros' },
];

export const CATEGORY_LABELS = {
  enlarger_cabin: 'Cabina',
  enlarger_post:  'Puesto',
  large_format:   'Gran Formato',
  film_develop:   'Película',
  scanner:        'Escáner',
  other:          'Otro',
};

// SVG icon keys used in ResourceCard
export const ICON_KEYS = ['enlarger', 'film', 'scanner', 'spool', 'iron', 'camera'];

// ── Initial seed data for resources ───────────────────────────────────────
// Used only when an admin first sets up the app via the seed button in Admin panel
// Booking rules per resource
// minDurationMin / maxDurationMin: duration constraints
// minAdvanceHours: must book at least N hours in advance
// conflictsWith: resource IDs that can't be booked simultaneously (same physical machine)
export const INITIAL_RESOURCES = [
  // Cabinas — min 3h, max 4h, 3-6h advance, conflict ByN↔Color per machine
  { id: 'cabina1_byn',   name: 'CABINA 1: ByN (Durst M805)',        shortName: 'Cab. 1 ByN',    category: 'enlarger_cabin', icon: 'enlarger', order: 1,  minDurationMin: 180, maxDurationMin: 240, minAdvanceHours: 3, conflictsWith: ['cabina1_color'] },
  { id: 'cabina1_color', name: 'CABINA 1: Color (Durst M805)',       shortName: 'Cab. 1 Color',  category: 'enlarger_cabin', icon: 'enlarger', order: 2,  minDurationMin: 180, maxDurationMin: 240, minAdvanceHours: 6, conflictsWith: ['cabina1_byn'] },
  { id: 'cabina2_byn',   name: 'CABINA 2: ByN (Magnifax)',           shortName: 'Cab. 2 ByN',    category: 'enlarger_cabin', icon: 'enlarger', order: 3,  minDurationMin: 180, maxDurationMin: 240, minAdvanceHours: 3, conflictsWith: ['cabina2_color'] },
  { id: 'cabina2_color', name: 'CABINA 2: Color (Magnifax)',         shortName: 'Cab. 2 Color',  category: 'enlarger_cabin', icon: 'enlarger', order: 4,  minDurationMin: 180, maxDurationMin: 240, minAdvanceHours: 6, conflictsWith: ['cabina2_byn'] },
  // Puestos — min 2h, max 4h, 2h advance
  { id: 'puesto3',       name: 'Puesto 3: ByN (Durst M805 BN)',     shortName: 'Puesto 3',      category: 'enlarger_post',  icon: 'enlarger', order: 5,  minDurationMin: 120, maxDurationMin: 240, minAdvanceHours: 2, conflictsWith: [] },
  { id: 'puesto4',       name: 'Puesto 4: ByN (Durst 800)',         shortName: 'Puesto 4',      category: 'enlarger_post',  icon: 'enlarger', order: 6,  minDurationMin: 120, maxDurationMin: 240, minAdvanceHours: 2, conflictsWith: [] },
  { id: 'puesto5',       name: 'Puesto 5: ByN (Opemus 7)',          shortName: 'Puesto 5',      category: 'enlarger_post',  icon: 'enlarger', order: 7,  minDurationMin: 120, maxDurationMin: 240, minAdvanceHours: 2, conflictsWith: [] },
  { id: 'puesto6',       name: 'Puesto 6: ByN (Durst M670)',        shortName: 'Puesto 6',      category: 'enlarger_post',  icon: 'enlarger', order: 8,  minDurationMin: 120, maxDurationMin: 240, minAdvanceHours: 2, conflictsWith: [] },
  // Gran formato — min 2h, max 4h
  { id: 'puesto7',       name: 'Puesto 7 Baylón: ByN Gran Formato', shortName: 'Puesto 7 GF',   category: 'large_format',   icon: 'enlarger', order: 9,  minDurationMin: 120, maxDurationMin: 240, minAdvanceHours: 2, conflictsWith: [] },
  { id: 'puesto8',       name: 'Puesto 8: ByN Gran Formato',        shortName: 'Puesto 8 GF',   category: 'large_format',   icon: 'enlarger', order: 10, minDurationMin: 120, maxDurationMin: 240, minAdvanceHours: 2, conflictsWith: [] },
  // Película — min 1h, max 4h (revelado rápido)
  { id: 'pelicula_byn1', name: 'Puesto Película ByN 1',             shortName: 'Pel. ByN 1',    category: 'film_develop',   icon: 'film',     order: 11, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  { id: 'pelicula_byn2', name: 'Puesto Película ByN 2',             shortName: 'Pel. ByN 2',    category: 'film_develop',   icon: 'film',     order: 12, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  { id: 'pelicula_c41',  name: 'Puesto Película C41',               shortName: 'Pel. C41',      category: 'film_develop',   icon: 'film',     order: 13, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  { id: 'pelicula_c41b', name: 'Puesto Película C41 2',             shortName: 'Pel. C41 2',    category: 'film_develop',   icon: 'film',     order: 14, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  { id: 'pelicula_ecn2', name: 'Puesto Película ECN2',              shortName: 'Pel. ECN2',     category: 'film_develop',   icon: 'film',     order: 15, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  // Escáneres — min 1h, max 4h
  { id: 'scanner_epson', name: 'Escáner plano EPSON',               shortName: 'Escáner EPSON', category: 'scanner',        icon: 'scanner',  order: 16, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  { id: 'scanner_pakon', name: 'Escáner Kodak Pakon F135',          shortName: 'Pakon F135',    category: 'scanner',        icon: 'scanner',  order: 17, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  // Otros — min 1h
  { id: 'bobinadora',    name: 'BOBINADORA',                        shortName: 'Bobinadora',    category: 'other',          icon: 'spool',    order: 18, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
  { id: 'plancha_fb',    name: 'PLANCHA FB',                        shortName: 'Plancha FB',    category: 'other',          icon: 'iron',     order: 19, minDurationMin: 60,  maxDurationMin: 240, minAdvanceHours: 1, conflictsWith: [] },
];

// ── Initial schedules seed data ────────────────────────────────────────────
export const INITIAL_SCHEDULES = [
  {
    id: 'horario_comunitario',
    name: 'Horario Comunitario',
    slots: [
      { id: 'slot_1100', label: '11:00', startMinute: 660,  durationMin: 60,  active: true },
      { id: 'slot_1200', label: '12:00', startMinute: 720,  durationMin: 60,  active: true },
      { id: 'slot_1300', label: '13:00', startMinute: 780,  durationMin: 90,  active: true },
      { id: 'slot_1430', label: '14:30', startMinute: 870,  durationMin: 150, active: true },
      { id: 'slot_1700', label: '17:00', startMinute: 1020, durationMin: 60,  active: true },
      { id: 'slot_1800', label: '18:00', startMinute: 1080, durationMin: 60,  active: true },
      { id: 'slot_1900', label: '19:00', startMinute: 1140, durationMin: 60,  active: true },
      { id: 'slot_2000', label: '20:00', startMinute: 1200, durationMin: 60,  active: true },
      { id: 'slot_2100', label: '21:00', startMinute: 1260, durationMin: 60,  active: true },
    ],
  },
  {
    id: 'horario_verano',
    name: 'Horario Verano',
    slots: [
      { id: 'slot_1100', label: '11:00', startMinute: 660,  durationMin: 60,  active: true },
      { id: 'slot_1200', label: '12:00', startMinute: 720,  durationMin: 60,  active: true },
      { id: 'slot_1300', label: '13:00', startMinute: 780,  durationMin: 90,  active: true },
      { id: 'slot_1700', label: '17:00', startMinute: 1020, durationMin: 60,  active: true },
      { id: 'slot_1800', label: '18:00', startMinute: 1080, durationMin: 60,  active: true },
      { id: 'slot_1900', label: '19:00', startMinute: 1140, durationMin: 60,  active: true },
      { id: 'slot_2000', label: '20:00', startMinute: 1200, durationMin: 60,  active: true },
    ],
  },
];

// ── Day/month labels ───────────────────────────────────────────────────────
export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS     = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// ── User accent colors ─────────────────────────────────────────────────────
export const USER_COLORS = [
  '#ff6b35', '#e8ff47', '#47c8ff', '#ff47c8', '#47ff9f',
  '#c847ff', '#ffc847', '#ff4747', '#47ffff', '#ffffff',
];
