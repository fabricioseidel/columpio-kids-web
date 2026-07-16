export function clp(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + Math.round(n).toLocaleString('es-CL')
}

export function fecha(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'short',
    timeStyle: 'short',
    ...opts,
  })
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
}
