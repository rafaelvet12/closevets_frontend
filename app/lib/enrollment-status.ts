const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmado: { label: "Ativo", color: "bg-green-100 text-green-700" },
  cursando: { label: "Cursando", color: "bg-green-100 text-green-700" },
  concluido: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  desistente: { label: "Desistente", color: "bg-red-100 text-red-700" },
  interessado: { label: "Interessado", color: "bg-amber-100 text-amber-700" },
  pre_inscrito: { label: "Pré-inscrito", color: "bg-amber-100 text-amber-700" },
  inscrito: { label: "Inscrito", color: "bg-amber-100 text-amber-700" },
  matriculado: { label: "Matriculado", color: "bg-amber-100 text-amber-700" },
  pagamento_pendente: { label: "Pagamento pendente", color: "bg-amber-100 text-amber-700" },
  ATIVO: { label: "Ativo", color: "bg-green-100 text-green-700" },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  CONCLUIDO: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
};

export const EDIT_STATUS_REVERSE_MAP: Record<string, string> = {
  confirmado: "ATIVO",
  cursando: "ATIVO",
  concluido: "CONCLUIDO",
  cancelado: "CANCELADO",
  ATIVO: "ATIVO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
};

export function getStatusDisplay(status: string): { label: string; color: string } {
  return STATUS_LABELS[status] || { label: status, color: "bg-slate-100 text-slate-700" };
}
