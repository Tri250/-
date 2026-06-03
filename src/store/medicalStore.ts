import { create } from 'zustand';
import { Symptom, MedicalConsultation, VetAppointment, MedicalRecord, MedicalStore } from '../types/medical';

const mockSymptoms: Symptom[] = [
  {
    id: '1',
    name: '食欲不振',
    description: '宠物进食量减少或拒绝进食',
    severity: 'medium',
    relatedConditions: ['消化系统问题', '牙齿问题', '压力反应']
  },
  {
    id: '2',
    name: '呕吐',
    description: '反复呕吐或干呕',
    severity: 'high',
    relatedConditions: ['胃炎', '食物中毒', '肠道阻塞']
  },
  {
    id: '3',
    name: '腹泻',
    description: '排便异常，粪便稀薄',
    severity: 'medium',
    relatedConditions: ['肠胃炎', '寄生虫感染', '食物过敏']
  },
  {
    id: '4',
    name: '发热',
    description: '体温升高，精神萎靡',
    severity: 'high',
    relatedConditions: ['感染', '炎症', '病毒性疾病']
  },
  {
    id: '5',
    name: '咳嗽',
    description: '频繁咳嗽或呼吸困难',
    severity: 'medium',
    relatedConditions: ['呼吸道感染', '心脏病', '过敏反应']
  }
];

export const useMedicalStore = create<MedicalStore>((set, _get) => ({
  symptoms: mockSymptoms,
  consultations: [],
  appointments: [],
  medicalRecords: [],
  currentConsultation: null,

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
      symptoms
    };

    set({ currentConsultation: consultation });

    // 模拟 AI 诊断延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    const completedConsultation: MedicalConsultation = {
      ...consultation,
      status: 'completed',
      diagnosis: '根据您描述的症状，建议您密切观察宠物的情况。如果症状持续或加重，请及时就医。',
      recommendations: [
        '确保宠物有充足的饮水',
        '监测体温变化',
        '记录症状出现的频率',
        '避免剧烈运动',
        '如症状持续超过24小时，请联系兽医'
      ]
    };

    set((state) => ({
      currentConsultation: completedConsultation,
      consultations: [completedConsultation, ...state.consultations]
    }));

    return completedConsultation;
  },

  bookAppointment: async (appointmentData) => {
    const appointment: VetAppointment = {
      ...appointmentData,
      id: Date.now().toString(),
      status: 'scheduled'
    };

    set((state) => ({ appointments: [appointment, ...state.appointments] }));
    return true;
  },

  addMedicalRecord: (record) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: Date.now().toString()
    };
    set((state) => ({ medicalRecords: [newRecord, ...state.medicalRecords] }));
  }
}));
