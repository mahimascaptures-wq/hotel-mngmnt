export type Role = 'admin' | 'doctor' | 'receptionist' | 'patient';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  head?: Doctor;
}

export interface Doctor {
  _id: string;
  user: User;
  specialization: string;
  department?: Department;
  qualifications?: string[];
  experienceYears?: number;
  consultationFee?: number;
  bio?: string;
  availableDays?: string[];
  availableFrom?: string;
  availableTo?: string;
}

export interface Patient {
  _id: string;
  user: User;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  emergencyContact?: { name?: string; relation?: string; phone?: string };
  allergies?: string[];
  chronicConditions?: string[];
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  department?: Department;
  date: string;
  timeSlot: string;
  reason?: string;
  notes?: string;
  status: AppointmentStatus;
  fee?: number;
  createdAt?: string;
}

export interface MedicalRecord {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  appointment?: Appointment;
  diagnosis: string;
  symptoms?: string[];
  treatment?: string;
  notes?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  visitDate?: string;
  createdAt?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  appointment?: Appointment;
  medications: Medication[];
  advice?: string;
  issuedDate?: string;
  createdAt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  patient: Patient;
  appointment?: Appointment;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'unpaid' | 'paid' | 'partial' | 'cancelled';
  paymentMethod?: string;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  user: ChatUser;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderIsMe: boolean;
  unreadCount: number;
}

export interface DashboardStats {
  counts: {
    patients: number;
    doctors: number;
    departments: number;
    appointmentsToday: number;
    totalAppointments: number;
    revenue: number;
  };
  appointmentsByStatus: Record<string, number>;
  apptTrend: { month: string; count: number }[];
  revenueTrend: { month: string; total: number }[];
  recentAppointments: Appointment[];
}
