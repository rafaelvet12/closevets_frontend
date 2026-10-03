export interface Student {
  id: number;
  name: string;
  email: string;
  cpf: string;
  rg?: string;
  phone?: string;
  profession?: string;
  crmv?: string;
  notes?: string;
}

export interface StudentPayload {
  name: string;
  email: string;
  cpf: string;
  rg: string;
  phone: string;
  profession: string;
  crmv: string;
  notes: string;
}

export interface Course {
  id: number;
  title: string;
  internal_name: string;
  code: string;
  workload_hours: number;
  default_price: number;
  modality: string;
  description?: string;
  is_active?: boolean;
}

export interface CoursePayload {
  title: string;
  internal_name: string;
  code: string;
  modality: string;
  workload_hours: number;
  default_price: number;
}

export interface Cohort {
  id: number;
  internal_name: string;
  code: string;
  price: number;
  hours: number;
  course_id: number;
  status: string;
}

export interface CohortPayload {
  internal_name: string;
  code: string;
  course_id: number;
  hours: number;
  price: number;
  status: string;
}

export interface Instructor {
  id: number;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  specialty: string;
  pix_key: string;
  hourly_rate: number;
}

export interface InstructorPayload {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  specialty: string;
  pix_key: string;
  hourly_rate: number;
}

export interface Enrollment {
  id: number;
  student_name: string;
  course_name: string;
  enrollment_date: string;
  status: string;
  payment_method?: string;
  final_price: number;
  cohort_id?: number;
  full_price?: number;
  discount?: number;
}

export interface StudentEnrollment {
  id: number;
  course_name: string;
  enrollment_date: string;
  status: string;
  payment_method?: string;
}

export interface EnrollmentPayload {
  student_id: number;
  cohort_id: number;
  full_price: number;
  discount: number;
  installments: number;
}

export interface EnrollmentUpdatePayload {
  status: string;
  payment_method: string;
}

export interface Transaction {
  id: number;
  type: string;
  category: string;
  description: string;
  amount_gross: number;
  discount_or_fee: number;
  amount_net: number;
  due_date: string;
  paid_at?: string | null;
  status: string;
  cohort_id?: number | null;
}

export interface TransactionPayload {
  type: string;
  category: string;
  description: string;
  amount_gross: number;
  discount_or_fee: number;
  due_date: string;
  status: string;
  cohort_id: number | null;
  paid_at: string | null;
}

export interface TransactionUpdatePayload {
  status: string;
  paid_at: string | null;
}

export interface Schedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  topic: string;
  instructor_id: number;
  instructor_name: string;
  executed_instructor_id?: number;
  executed_instructor_name?: string;
  hours: number;
  real_duration_hours?: number;
  status: string;
}

export interface SchedulePayload {
  cohort_id: number;
  instructor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  topic: string;
  hours: number;
}

export interface CompleteLessonPayload {
  executed_instructor_id: number;
  real_duration_hours: number;
}

export interface CertificateSnapshot {
  aluno_nome: string;
  aluno_cpf?: string;
  curso_nome: string;
  turma_codigo: string;
  carga_horaria: number;
  data_inicio?: string;
  data_fim?: string;
}

export interface Certificate {
  id: number;
  enrollment_id: number;
  uuid_code: string;
  status: string;
  issued_at: string;
  snapshot_data: CertificateSnapshot;
}

export interface CertificateValidation {
  uuid_code: string;
  status: string;
  snapshot_data: CertificateSnapshot;
  issued_at: string;
}

export interface DreReport {
  total_gross?: number;
  total_discount?: number;
  total_income: number;
  total_expense: number;
  profit: number;
  margin_percentage: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role?: string;
}

export interface NamedOption {
  id: number;
  name?: string;
  internal_name?: string;
  price?: number;
  title?: string;
  workload_hours?: number;
  hours?: number;
  code?: string;
  hourly_rate?: number;
}
