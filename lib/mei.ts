export const MEI_DEFAULT_ANNUAL = 81000
export const MEI_DEFAULT_MONTHLY = 6750

export type MeiSettingsLike = {
  openingMonth: number
  openingYear: number
  annualLimit: number
  monthlyLimit: number
} | null

/**
 * Teto de faturamento do MEI para um determinado ano.
 *
 * No ano de abertura o limite é proporcional: monthlyLimit × (meses de abertura
 * até dezembro). Nos anos seguintes vale o limite anual cheio. Antes da abertura,
 * zero. Sem configuração, usa o limite anual padrão.
 */
export function meiLimitForYear(settings: MeiSettingsLike, year: number): number {
  if (!settings) return MEI_DEFAULT_ANNUAL

  const { openingMonth, openingYear, annualLimit, monthlyLimit } = settings

  if (year < openingYear) return 0
  if (year > openingYear) return annualLimit

  // Ano de abertura: proporcional aos meses restantes (inclusive o mês de abertura).
  const months = 13 - openingMonth
  return monthlyLimit * months
}
