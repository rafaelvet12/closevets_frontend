export function formatCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

export function formatPhone(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}

export function formatCrmv(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const match = cleaned.match(/^(\d{0,2})(\d{0,3})([A-Z]{0,2})/);
  if (!match) return cleaned;
  let result = match[1];
  if (match[2]) result += "." + match[2];
  if (match[3]) result += "-" + match[3];
  return result;
}

export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  return Number(value.replace(/\./g, "").replace(",", ".")) || 0;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatIsoDateToBr(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.slice(0, 10).split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatLongDate(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "";
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return "";
  return `${day} de ${MESES[month - 1]} de ${match[1]}`;
}

export function formatCoursePeriod(start?: string | null, end?: string | null): string {
  const inicio = formatLongDate(start);
  const fim = formatLongDate(end);
  if (inicio && fim && inicio !== fim) return `de ${inicio} a ${fim}`;
  const chosen = fim || inicio;
  return chosen ? `no dia ${chosen}` : "";
}

export function formatCohortPeriod(start?: string | null, end?: string | null): string {
  const inicio = formatIsoDateToBr(start || "");
  const fim = formatIsoDateToBr(end || "");
  if (inicio && fim) return `${inicio} a ${fim}`;
  return inicio || fim;
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${month}/${year}`;
}

export function formatEnrollmentId(id: number): string {
  return `MAT-${id.toString().padStart(5, "0")}`;
}

export function maskPublicCpf(cpf: string): string {
  if (!cpf || cpf.length < 3) return "..***-00";
  const digits = cpf.replace(/\D/g, "");
  return `..***-${digits.slice(-2)}`;
}

export function currentYearMonth(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${today.getFullYear()}-${month}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}
