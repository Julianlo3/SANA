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
