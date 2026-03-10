import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('patients.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    mrn TEXT,
    firstName TEXT,
    lastName TEXT,
    age INTEGER,
    sex TEXT,
    site TEXT,
    bed TEXT,
    triageLevel TEXT,
    chiefComplaint TEXT,
    status TEXT,
    vitals TEXT,
    pewsMews TEXT,
    tmStatus INTEGER,
    meds INTEGER,
    labs INTEGER,
    procedures INTEGER,
    imaging INTEGER,
    ekg INTEGER,
    alerts TEXT,
    comments TEXT,
    los TEXT,
    signed INTEGER,
    admittedAt TEXT,
    transferNote TEXT,
    dischargePlan TEXT,
    documentation TEXT
  )
`);

const SEED_PATIENTS = [
  {
    id: 'P001',
    mrn: 'MCI-Site 1 001',
    firstName: 'John',
    lastName: 'Doe',
    age: 34,
    sex: 'M',
    site: 'Site 1',
    bed: '-',
    triageLevel: 'M',
    chiefComplaint: 'Trauma',
    status: 'Admitted',
    vitals: JSON.stringify({ bp: '-', hr: '-', rr: '-', o2: '-', temp: '-' }),
    pewsMews: null,
    tmStatus: 0,
    meds: 0,
    labs: 0,
    procedures: 0,
    imaging: 0,
    ekg: 0,
    alerts: JSON.stringify([]),
    comments: '',
    los: '0m',
    signed: 0,
    admittedAt: new Date().toISOString(),
    transferNote: null,
    dischargePlan: null,
    documentation: JSON.stringify([
      {
        id: 'DTM000284172',
        date: '12/27/2023 10:30 PM',
        note: 'Medic/RN Encounter Note - General',
        status: 'Unsigned',
        author: 'Amy Davis',
        signedBy: 'Amy Davis'
      },
      {
        id: 'DTM000284173',
        date: '12/27/2023 10:30 PM',
        note: 'Medical Provider Encounter Note - General Adult - Brief',
        status: 'In Error',
        author: 'Amy Davis',
        signedBy: 'Amy Davis'
      },
      {
        id: 'DTM000284174',
        date: '12/27/2023 10:30 PM',
        note: 'Telemedicine encounter note',
        status: 'Signed',
        author: 'Amy Davis',
        signedBy: 'Amy Davis'
      }
    ])
  },
  {
    id: 'P002',
    mrn: 'MCI-Site 1 002',
    firstName: 'Jane',
    lastName: 'Smith',
    age: 45,
    sex: 'F',
    site: 'Site 1',
    bed: '-',
    triageLevel: 'I',
    chiefComplaint: 'Cardiac',
    status: 'Admitted',
    vitals: JSON.stringify({ bp: '110/74', hr: '89', rr: '16', o2: '98% 2L NC', temp: '36.8°C' }),
    pewsMews: '3',
    tmStatus: 1,
    meds: 1,
    labs: 1,
    procedures: 0,
    imaging: 0,
    ekg: 1,
    alerts: JSON.stringify(['Spanish']),
    comments: '',
    los: '5m',
    signed: 0,
    admittedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    transferNote: null,
    dischargePlan: null,
    documentation: JSON.stringify([])
  }
];

const app = express();
app.use(express.json());

// API Routes
app.post('/api/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM patients').run();

    const insert = db.prepare(`
      INSERT INTO patients (
        id, mrn, firstName, lastName, age, sex, site, bed, triageLevel, chiefComplaint, 
        status, vitals, pewsMews, tmStatus, meds, labs, procedures, imaging, ekg, 
        alerts, comments, los, signed, admittedAt, transferNote, dischargePlan, documentation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of SEED_PATIENTS) {
      insert.run(
        p.id, p.mrn, p.firstName, p.lastName, p.age, p.sex, p.site, p.bed, p.triageLevel, p.chiefComplaint,
        p.status, p.vitals, p.pewsMews, p.tmStatus, p.meds, p.labs, p.procedures, p.imaging, p.ekg,
        p.alerts, p.comments, p.los, p.signed, p.admittedAt, p.transferNote, p.dischargePlan, p.documentation
      );
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Reset failed:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

app.get('/api/patients', (req, res) => {
  const patients = db.prepare('SELECT * FROM patients').all().map((p: any) => ({
    ...p,
    vitals: JSON.parse(p.vitals),
    alerts: JSON.parse(p.alerts),
    tmStatus: !!p.tmStatus,
    meds: !!p.meds,
    labs: !!p.labs,
    procedures: !!p.procedures,
    imaging: !!p.imaging,
    ekg: !!p.ekg,
    signed: !!p.signed,
    transferNote: p.transferNote ? JSON.parse(p.transferNote) : null,
    dischargePlan: p.dischargePlan ? JSON.parse(p.dischargePlan) : null,
    documentation: p.documentation ? JSON.parse(p.documentation) : []
  }));
  res.json(patients);
});

app.get('/api/patients/:id', (req, res) => {
  const p: any = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  
  res.json({
    ...p,
    vitals: JSON.parse(p.vitals),
    alerts: JSON.parse(p.alerts),
    tmStatus: !!p.tmStatus,
    meds: !!p.meds,
    labs: !!p.labs,
    procedures: !!p.procedures,
    imaging: !!p.imaging,
    ekg: !!p.ekg,
    signed: !!p.signed,
    transferNote: p.transferNote ? JSON.parse(p.transferNote) : null,
    dischargePlan: p.dischargePlan ? JSON.parse(p.dischargePlan) : null,
    documentation: p.documentation ? JSON.parse(p.documentation) : []
  });
});

app.patch('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const current: any = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Patient not found' });

  const fields = Object.keys(updates);
  if (fields.length === 0) return res.json(current);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    const val = updates[f];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    if (typeof val === 'boolean') return val ? 1 : 0;
    return val;
  });

  db.prepare(`UPDATE patients SET ${setClause} WHERE id = ?`).run(...values, id);
  
  const updated: any = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
  res.json({
    ...updated,
    vitals: JSON.parse(updated.vitals),
    alerts: JSON.parse(updated.alerts),
    tmStatus: !!updated.tmStatus,
    meds: !!updated.meds,
    labs: !!updated.labs,
    procedures: !!updated.procedures,
    imaging: !!updated.imaging,
    ekg: !!updated.ekg,
    signed: !!updated.signed,
    transferNote: updated.transferNote ? JSON.parse(updated.transferNote) : null,
    dischargePlan: updated.dischargePlan ? JSON.parse(updated.dischargePlan) : null,
    documentation: updated.documentation ? JSON.parse(updated.documentation) : []
  });
});

async function startServer() {
  // Clear and re-seed on every restart as requested
  try {
    db.prepare('DELETE FROM patients').run();

    const insert = db.prepare(`
      INSERT INTO patients (
        id, mrn, firstName, lastName, age, sex, site, bed, triageLevel, chiefComplaint, 
        status, vitals, pewsMews, tmStatus, meds, labs, procedures, imaging, ekg, 
        alerts, comments, los, signed, admittedAt, transferNote, dischargePlan, documentation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of SEED_PATIENTS) {
      insert.run(
        p.id, p.mrn, p.firstName, p.lastName, p.age, p.sex, p.site, p.bed, p.triageLevel, p.chiefComplaint,
        p.status, p.vitals, p.pewsMews, p.tmStatus, p.meds, p.labs, p.procedures, p.imaging, p.ekg,
        p.alerts, p.comments, p.los, p.signed, p.admittedAt, p.transferNote, p.dischargePlan, p.documentation
      );
    }
    console.log('Database seeded successfully');
  } catch (err) {
    console.error('Failed to seed database:', err);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 8080;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
