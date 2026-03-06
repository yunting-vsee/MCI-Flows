/* ============================================================
   ASPR DT  -  Shared Patient State & Data Model
   ============================================================
   This file is the single source of truth for all patient data.
   Every page includes it and reads/writes through the API below.
   Data lives in memory (sessionStorage backup) so refreshing
   within the same tab keeps state; opening a new tab resets.
   ============================================================ */

const STORAGE_KEY = 'asprdt_patients';

/* ---------- Triage Level Definitions ---------- */
const TRIAGE_LEVELS = {
  I:  { code: 'I',  label: 'Immediate',  cssClass: 'triage-badge--immediate' },
  D:  { code: 'D',  label: 'Delayed',    cssClass: 'triage-badge--delayed'   },
  M:  { code: 'M',  label: 'Minor',      cssClass: 'triage-badge--minor'     },
  Ex: { code: 'Ex', label: 'Expectant',  cssClass: 'triage-badge--expectant' },
  X:  { code: 'X',  label: 'Deceased',   cssClass: 'triage-badge--deceased'  },
};

/* ---------- Patient Status Flow ---------- */
const PATIENT_STATUSES = {
  ADMITTED:           'Admitted',
  TRANSFER_ORDERED:   'Transport Ordered',
  IN_TRANSIT:         'In-Transit',
  TRANSFER_COMPLETE:  'Transfer Complete',
  DISCHARGED:         'Discharged',
  OTHER_DISPOSITION:  'Other Disposition',
};

/* Helper: status -> CSS class for tag */
function statusToCssClass(status) {
  const map = {
    [PATIENT_STATUSES.ADMITTED]:          'tag--admitted',
    [PATIENT_STATUSES.TRANSFER_ORDERED]:  'tag--transfer-ordered',
    [PATIENT_STATUSES.IN_TRANSIT]:        'tag--in-transit',
    [PATIENT_STATUSES.TRANSFER_COMPLETE]: 'tag--transfer-complete',
    [PATIENT_STATUSES.DISCHARGED]:        'tag--discharged',
    [PATIENT_STATUSES.OTHER_DISPOSITION]: 'tag--discharged',
  };
  return map[status] || 'tag--admitted';
}

/* ---------- Destination Sites ---------- */
const DESTINATION_SITES = [
  { code: 'CH',   name: 'Central Hospital' },
  { code: 'GWUH', name: 'George Washington University Hospital' },
  { code: 'EMS',  name: 'EMS Transit Unit' },
];

/* ---------- Bed Category Options ---------- */
const BED_CATEGORIES = [
  'Burn',
  'Critical Care',
  'Med/Surg',
  'Negative Pressure/Isolation',
  'Pediatric',
  'Psychiatric',
  'Pediatric Critical',
];

/* ---------- Seed Data: 2 Patients at MCI Site 1 ---------- */
function createSeedPatients() {
  return [
    {
      id: 'P001',
      mrn: 'MCI-Site1 001',
      firstName: 'John',
      lastName: 'Doe',
      age: 34,
      sex: 'M',
      site: 'Site1',
      bed: '-',
      triageLevel: 'M',           // Minor – simple transfer, no provider visit
      chiefComplaint: 'Trauma',
      status: PATIENT_STATUSES.ADMITTED,
      vitals: { bp: '-', hr: '-', rr: '-', o2: '-', temp: '-' },
      pewsMews: null,
      tmStatus: null,
      meds: false,
      labs: false,
      procedures: false,
      imaging: false,
      ekg: false,
      alerts: [],
      comments: '',
      dcStatus: null,             // no discharge plan yet
      los: '0m',
      signed: false,
      transferNote: null,         // will be populated when transfer is initiated
      dischargeOrder: null,       // not needed – simple transfer
      admittedAt: new Date().toISOString(),
    },
    {
      id: 'P002',
      mrn: 'MCI-Site1 002',
      firstName: 'Jane',
      lastName: 'Smith',
      age: 45,
      sex: 'F',
      site: 'Site1',
      bed: '-',
      triageLevel: 'I',           // Immediate – complex case
      chiefComplaint: 'Cardiac',
      status: PATIENT_STATUSES.ADMITTED,
      vitals: { bp: '-', hr: '-', rr: '-', o2: '-', temp: '-' },
      pewsMews: null,
      tmStatus: null,
      meds: false,
      labs: false,
      procedures: false,
      imaging: false,
      ekg: false,
      alerts: [],
      comments: '',
      dcStatus: null,
      los: '5m',
      signed: false,
      transferNote: null,
      dischargeOrder: null,       // will need provider discharge + mid-transit re-triage
      admittedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ];
}


/* ---------- State Manager ---------- */
const PatientState = (() => {
  let _patients = [];
  let _listeners = [];

  /* Initialize from sessionStorage or seed */
  function init() {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        _patients = JSON.parse(stored);
      } catch {
        _patients = createSeedPatients();
      }
    } else {
      _patients = createSeedPatients();
    }
    _persist();
  }

  /* Persist to sessionStorage */
  function _persist() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_patients));
  }

  /* Notify listeners */
  function _notify() {
    _listeners.forEach(fn => fn(_patients));
  }

  /* Subscribe to changes */
  function subscribe(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  }

  /* Get all patients */
  function getAll() {
    return [..._patients];
  }

  /* Get single patient by id */
  function getById(id) {
    return _patients.find(p => p.id === id) || null;
  }

  /* Update a patient (partial merge) */
  function update(id, changes) {
    const idx = _patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    _patients[idx] = { ..._patients[idx], ...changes };
    _persist();
    _notify();
    return _patients[idx];
  }

  /* Update patient status specifically */
  function updateStatus(id, newStatus) {
    return update(id, { status: newStatus });
  }

  /* Set transfer note on a patient */
  function setTransferNote(id, transferNote) {
    return update(id, { transferNote });
  }

  /* Update triage level */
  function updateTriage(id, newLevel) {
    if (!TRIAGE_LEVELS[newLevel]) return null;
    return update(id, { triageLevel: newLevel });
  }

  /* Compute LOS string from admittedAt to now */
  function computeLOS(patient) {
    if (!patient.admittedAt) return '0m';
    const diff = Date.now() - new Date(patient.admittedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }

  /* Reset to seed data */
  function reset() {
    _patients = createSeedPatients();
    _persist();
    _notify();
  }

  return {
    init,
    subscribe,
    getAll,
    getById,
    update,
    updateStatus,
    setTransferNote,
    updateTriage,
    computeLOS,
    reset,
    TRIAGE_LEVELS,
    PATIENT_STATUSES,
    BED_CATEGORIES,
    DESTINATION_SITES,
    statusToCssClass,
  };
})();

/* Auto-init when script loads */
PatientState.init();
