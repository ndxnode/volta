import type { Car } from '@/lib/car-schema'

/** A single exportable spec row: a label and a plain-string value per car. */
export interface CompareCsvRow {
  label: string
  /** Returns the RAW, plain-string value for a car (no React nodes). */
  value: (car: Car) => string
}

/** Full display name for a car, used as a CSV column header. */
export function carFullName(car: Car): string {
  return `${car.year} ${car.make} ${car.model} ${car.variant}`
}

/**
 * RFC-4180 field escaping: wrap a field in double quotes when it contains a
 * comma, double quote, or CR/LF, and double any interior double quotes.
 */
function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Pure serializer for the visible compare matrix.
 *
 * Header row = `Spec` + each car's full name. One line per visible spec row,
 * using the row's plain-string `value`. Cells are joined with `,`, lines with
 * `\r\n` (RFC-4180). No DOM / Blob glue lives here so this stays unit-testable.
 */
export function serializeCompareCsv(cars: Car[], rows: CompareCsvRow[]): string {
  const header = ['Spec', ...cars.map(carFullName)]
  const lines = [header, ...rows.map((row) => [row.label, ...cars.map(row.value)])]

  return lines
    .map((cells) => cells.map(escapeCsvField).join(','))
    .join('\r\n')
}
