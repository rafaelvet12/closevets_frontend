import { API_BASE_URL, fetchWithAuth } from "@/app/config";
import { ApiError, api } from "@/app/lib/api";
import type {
  Certificate,
  CertificateValidation,
  Cohort,
  CohortPayload,
  CompleteLessonPayload,
  Course,
  CoursePayload,
  DreReport,
  Enrollment,
  EnrollmentPayload,
  EnrollmentUpdatePayload,
  Instructor,
  InstructorPayload,
  LoginResponse,
  Schedule,
  SchedulePayload,
  Student,
  StudentEnrollment,
  StudentPayload,
  Transaction,
  TransactionPayload,
  TransactionUpdatePayload,
} from "@/app/types/domain";

export function login(email: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
}

export function listStudents(): Promise<Student[]> {
  return api<Student[]>("/alunos/");
}

export function saveStudent(id: number | undefined, payload: StudentPayload): Promise<Student> {
  return api<Student>(id ? `/alunos/${id}` : "/alunos/", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export function deactivateStudent(id: number): Promise<{ message: string }> {
  return api<{ message: string }>(`/alunos/${id}`, { method: "DELETE" });
}

export function listStudentEnrollments(studentId: number): Promise<StudentEnrollment[]> {
  return api<StudentEnrollment[]>(`/matriculas/aluno/${studentId}`);
}

export function listCourses(): Promise<Course[]> {
  return api<Course[]>("/courses/");
}

export function saveCourse(id: number | undefined, payload: CoursePayload): Promise<Course> {
  return api<Course>(id ? `/courses/${id}` : "/courses/", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export function deactivateCourse(id: number): Promise<{ message: string }> {
  return api<{ message: string }>(`/courses/${id}`, { method: "DELETE" });
}

export function listCohorts(): Promise<Cohort[]> {
  return api<Cohort[]>("/turmas/");
}

export function saveCohort(id: number | null, payload: CohortPayload): Promise<Cohort> {
  return api<Cohort>(id ? `/turmas/${id}` : "/turmas/", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export function listInstructors(): Promise<Instructor[]> {
  return api<Instructor[]>("/professores/");
}

export function saveInstructor(id: number | undefined, payload: InstructorPayload): Promise<Instructor> {
  return api<Instructor>(id ? `/professores/${id}` : "/professores/", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export function deactivateInstructor(id: number): Promise<{ message: string }> {
  return api<{ message: string }>(`/professores/${id}`, { method: "DELETE" });
}

export function listEnrollments(): Promise<Enrollment[]> {
  return api<Enrollment[]>("/matriculas/");
}

export function createEnrollment(payload: EnrollmentPayload): Promise<Enrollment> {
  return api<Enrollment>("/matriculas/", { method: "POST", body: JSON.stringify(payload) });
}

export function updateEnrollment(id: number, payload: EnrollmentUpdatePayload): Promise<{ message: string }> {
  return api<{ message: string }>(`/matriculas/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function listTransactions(): Promise<Transaction[]> {
  return api<Transaction[]>("/finance/");
}

export function saveTransaction(id: number | null, payload: TransactionPayload): Promise<Transaction> {
  return api<Transaction>(id ? `/finance/${id}` : "/finance/", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTransactionStatus(id: number, payload: TransactionUpdatePayload): Promise<{ message: string }> {
  return api<{ message: string }>(`/finance/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function getGlobalDre(): Promise<DreReport> {
  return api<DreReport>("/finance/dre/global");
}

export function getCohortDre(cohortId: string): Promise<DreReport> {
  return api<DreReport>(`/dashboard/dre/${cohortId}`);
}

export function listSchedules(cohortId: string): Promise<Schedule[]> {
  return api<Schedule[]>(`/schedules/cohort/${cohortId}`);
}

export function createSchedule(payload: SchedulePayload): Promise<{ message: string; id: number }> {
  return api<{ message: string; id: number }>("/schedules/", { method: "POST", body: JSON.stringify(payload) });
}

export function completeSchedule(id: number, payload: CompleteLessonPayload): Promise<{ message: string }> {
  return api<{ message: string }>(`/schedules/${id}/complete`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteSchedule(id: number): Promise<{ message: string }> {
  return api<{ message: string }>(`/schedules/${id}`, { method: "DELETE" });
}

export function listCertificates(): Promise<Certificate[]> {
  return api<Certificate[]>("/certificados/");
}

export function issueCertificate(enrollmentId: number): Promise<Certificate> {
  return api<Certificate>("/certificados/", {
    method: "POST",
    body: JSON.stringify({ enrollment_id: enrollmentId }),
  });
}

export function validateCertificate(code: string): Promise<CertificateValidation> {
  return api<CertificateValidation>(`/certificados/validar/${code}`);
}

export async function downloadCertificate(uuid: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/certificados/${uuid}/download`);
  if (!response.ok) {
    throw new ApiError("Não foi possível baixar o certificado.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Certificado_CloseVets_${uuid}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
