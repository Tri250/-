export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relatedConditions: string[];
}

export interface MedicalConsultation {
  id: string;
  date: Date;
  type: 'ai' | 'vet';
  status: 'pending' | 'in_progress' | 'completed';
  symptoms: string[];
  diagnosis?: string;
  recommendations?: string[];
  prescription?: string;
  notes?: string;
}

export interface VetAppointment {
  id: string;
  date: Date;
  time: string;
  vetName: string;
  clinicName: string;
  address: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  date: Date;
  type: 'vaccination' | 'checkup' | 'treatment' | 'surgery';
  title: string;
  description: string;
  vetName?: string;
  documents?: string[];
  nextDueDate?: Date;
}

export interface MedicalStore {
  symptoms: Symptom[];
  consultations: MedicalConsultation[];
  appointments: VetAppointment[];
  medicalRecords: MedicalRecord[];
  currentConsultation: MedicalConsultation | null;
  
  setSymptoms: (symptoms: Symptom[]) => void;
  setConsultations: (consultations: MedicalConsultation[]) => void;
  setAppointments: (appointments: VetAppointment[]) => void;
  setMedicalRecords: (records: MedicalRecord[]) => void;
  startAIConsultation: (symptoms: string[]) => Promise<MedicalConsultation>;
  bookAppointment: (appointment: Omit<VetAppointment, 'id' | 'status'>) => Promise<boolean>;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id'>) => void;
  initialize: () => Promise<void>;
}
