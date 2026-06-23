import { create } from 'zustand';
import { Symptom, MedicalConsultation, VetAppointment, MedicalRecord, MedicalStore } from '../types/medical';
import { api } from '../lib/api';

export const useMedicalStore = create<MedicalStore>((set, get) => ({
  symptoms: [],
  consultations: [],
  appointments: [],
  medicalRecords: [],
  currentConsultation: null,
  loading: false,
  error: null,

  fetchSymptoms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ symptoms: Symptom[] }>('/medical/symptoms');
      set({ symptoms: data.symptoms, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取症状列表失败', loading: false });
    }
  },

  fetchConsultations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ consultations: MedicalConsultation[] }>('/medical-records');
      set({ consultations: data.consultations.map(c => ({ ...c, date: new Date(c.date) })), loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取问诊记录失败', loading: false });
    }
  },

  fetchMedicalRecords: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ records: MedicalRecord[] }>('/medical-records/all');
      set({ medicalRecords: data.records.map(r => ({ ...r, date: new Date(r.date), nextDueDate: r.nextDueDate ? new Date(r.nextDueDate) : undefined })), loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取医疗记录失败', loading: false });
    }
  },

  setSymptoms: (symptoms) => set({ symptoms }),
  setConsultations: (consultations) => set({ consultations }),
  setAppointments: (appointments) => set({ appointments }),
  setMedicalRecords: (records) => set({ medicalRecords: records }),

  startAIConsultation: async (symptoms) => {
    const consultation: MedicalConsultation = {
      id: Date.now().toString(),
      date: new Date(),
      type: 'ai',
      status: 'in_progress',
      symptoms,
    };

    set({ currentConsultation: consultation });

    try {
      const data = await api.post<{ consultation: MedicalConsultation }>('/medical/ai-consultation', { symptoms });
      const completedConsultation: MedicalConsultation = {
        ...data.consultation,
        id: consultation.id,
        date: new Date(data.consultation.date),
        type: 'ai',
        status: 'completed',
      };

      set((state) => ({
        currentConsultation: completedConsultation,
        consultations: [completedConsultation, ...state.consultations],
      }));

      return completedConsultation;
    } catch {
      const completedConsultation: MedicalConsultation = {
        ...consultation,
        status: 'completed',
        diagnosis: 'AI 分析暂时不可用，请稍后重试或联系兽医。',
        recommendations: ['确保宠物有充足的饮水', '观察症状变化', '如症状持续，请联系兽医'],
      };

      set((state) => ({
        currentConsultation: completedConsultation,
        consultations: [completedConsultation, ...state.consultations],
      }));

      return completedConsultation;
    }
  },

  bookAppointment: async (appointmentData) => {
    try {
      const data = await api.post<{ appointment: VetAppointment }>('/medical/appointments', appointmentData);
      set((state) => ({ appointments: [data.appointment, ...state.appointments] }));
      return true;
    } catch {
      return false;
    }
  },

  addMedicalRecord: (record) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: Date.now().toString(),
    };
    set((state) => ({ medicalRecords: [newRecord, ...state.medicalRecords] }));
  },
}));