// Date / time helpers for the scheduling UI. All display is in the
// viewer's local timezone; values are stored as ISO timestamptz.

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day // make Monday the first day
  d.setDate(d.getDate() + diff)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatDayLabel(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`
}

export function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const meridiem = hours < 12 ? "AM" : "PM"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return minutes === 0
    ? `${displayHours} ${meridiem}`
    : `${displayHours}:${minutes.toString().padStart(2, "0")} ${meridiem}`
}

export function formatDateTime(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const meridiem = hours < 12 ? "AM" : "PM"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const timeStr = minutes === 0
    ? `${displayHours} ${meridiem}`
    : `${displayHours}:${minutes.toString().padStart(2, "0")} ${meridiem}`
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${timeStr}`
}

// Combine a yyyy-mm-dd date string and a HH:mm time string into a Date (local tz)
export function combineDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`)
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

// Working hours shown in the calendar grid
export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 20
