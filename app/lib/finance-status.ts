const PAID_STATUSES = ["PAID", "PAGO", "LIQUIDADO"];
const PENDING_STATUSES = ["PENDING", "PENDENTE", "A PAGAR", "A RECEBER"];
const INCOME_TYPES = ["INCOME", "RECEITA", "ENTRADA"];

export function isPaidStatus(status: string): boolean {
  return PAID_STATUSES.includes(status.toUpperCase());
}

export function isPendingStatus(status: string): boolean {
  return PENDING_STATUSES.includes(status.toUpperCase());
}

export function isIncomeType(type: string): boolean {
  return INCOME_TYPES.includes(type.toUpperCase());
}
