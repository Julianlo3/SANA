export interface ConsultantResponse {
  id: number;
  fullName: string;
  cardType: string;
  identityDocument: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
  termsAccepted: boolean;
  residenceZone: string | null;
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  createdAt: string;
  updatedAt: string | null;
  appointmentCount: number;
  lastAppointmentDate: string | null;
  assignedPsychologistName: string | null;
}

export interface PsychologistConsultantSummaryResponse {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  residence: null;
  status: 'active' | 'inactive';
  assignedPsychologistId: number;
  assignedPsychologistName: null;
  lastAppointmentAt: Date | null;
  appointmentCount: number;
  completedAppointmentCount: number;
  waitingAppointmentCount: number;
}

export interface PsychologistConsultantAppointmentResponse {
  id: number;
  state: 'asignada' | 'confirmada' | 'realizada';
  appDate: Date | null;
  duration: number | null;
  reason: string | null;
  patientType: 'self' | 'dependent';
  patientName: string;
  patientDependentId: number | null;
  clinicalNotes: {
    id: number;
    observation: string;
    createdAt: Date;
  }[];
}

export interface PsychologistConsultantRecordResponse
  extends PsychologistConsultantSummaryResponse {
  appointments: PsychologistConsultantAppointmentResponse[];
  careRecords: {
    id: number;
    appointmentId: number;
    attendedAt: Date | null;
    observation: string;
    patientType: 'self' | 'dependent';
    patientName: string;
    patientDependentId: number | null;
    recordedByPsychologistId: number;
    recordedByPsychologistName: string;
  }[];
}
