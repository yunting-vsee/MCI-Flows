import { Patient } from './types';

export const getPatients = async (): Promise<Patient[]> => {
  const response = await fetch('/api/patients');
  if (!response.ok) throw new Error('Failed to fetch patients');
  return response.json();
};

export const resetPatients = async (): Promise<void> => {
  const response = await fetch('/api/reset', { method: 'POST' });
  if (!response.ok) throw new Error('Failed to reset patients');
};

export const updatePatient = async (id: string, updates: Partial<Patient>): Promise<Patient | null> => {
  const response = await fetch(`/api/patients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) return null;
  return response.json();
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  const response = await fetch(`/api/patients/${id}`);
  if (!response.ok) return null;
  return response.json();
};
