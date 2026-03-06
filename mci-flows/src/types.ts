export enum TriageCode {
  IMMEDIATE = 'I',
  DELAYED = 'D',
  MINOR = 'M',
  EXPECTANT = 'Ex',
  DECEASED = 'X',
}

export enum PatientStatus {
  ADMITTED = 'Admitted',
  TRANSFER_ORDERED = 'Transport Ordered',
  IN_TRANSIT = 'In-Transit',
  TRANSFER_COMPLETE = 'Transfer Complete',
  DISCHARGED = 'D/C',
  OTHER_DISPOSITION = 'Other Disposition',
  DISCHARGED_COMPLETE = 'D/C-C',
}

export interface Vitals {
  bp: string;
  hr: string;
  rr: string;
  o2: string;
  temp: string;
}

export interface DischargePlan {
  id: string;
  createdAt: string;
  providerName: string;
  dispositionDate: string;
  diagnosis: string;
  disposition: string;
  dischargeAcuity: string;
  transferType?: string;
  destinationSite: string;
  bedCategory: string;
  specialty: string;
  additionalCapabilities: string[];
  receivingProvider?: string;
  instructions: {
    label: string;
    content: string[];
    patientInstructions: string;
  };
  prescriptions: Array<{
    name: string;
    duration: string;
    instructions: string;
    prescribedBy: string;
  }>;
  medsToGo: Array<{
    name: string;
    quantity: string;
    comments: string;
    prescribedBy: string;
  }>;
  status: 'Draft' | 'Finalized' | 'Replaced';
}

export interface TransferNote {
  status: string;
  toCode: string;
  toName: string;
  fromSite: string;
  transport: string;
  ambulanceId?: string;
  transitTime: string;
  eta: string;
  jpats: boolean;
  jpatsNumber?: string;
  details: string;
  completeTime?: string;
  completeDetails?: string;
  // New fields
  specialty?: string;
  bedCategory?: string;
  additionalCapabilities?: string[];
  receivingTime?: string;
  dispositionTime?: string;
  dispositionDetails?: string;
  isDischargeProcess?: boolean;
}

export interface DocumentationEntry {
  id: string;
  date: string;
  note: string;
  status: 'Unsigned' | 'In Error' | 'Signed' | 'Superseded';
  author: string;
  signedBy?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  site: string;
  bed: string;
  triageLevel: TriageCode;
  chiefComplaint: string;
  status: PatientStatus;
  vitals: Vitals;
  pewsMews: string | null;
  tmStatus: boolean;
  meds: boolean;
  labs: boolean;
  procedures: boolean;
  imaging: boolean;
  ekg: boolean;
  alerts: string[];
  comments: string;
  los: string;
  signed: boolean;
  admittedAt: string;
  dischargePlan?: DischargePlan | null;
  transferNote?: TransferNote | null;
  documentation?: DocumentationEntry[];
}
