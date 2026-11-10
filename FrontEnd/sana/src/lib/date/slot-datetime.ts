/**
 * Fixed UTC offset used for Colombia local datetimes.
 */
export const COLOMBIA_UTC_OFFSET = "-05:00";

/**
 * Formats date parts using the Colombia time zone.
 */
const COLOMBIA_DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
});

/**
 * Returns the current date in Colombia.
 * @returns Today's date in YYYY-MM-DD format.
 */
export function getColombiaToday(): string {
  return COLOMBIA_DAY_FORMAT.format(new Date());
}

/**
 * Builds an ISO datetime for a slot using the fixed Colombia offset.
 * @param date Slot date in YYYY-MM-DD format.
 * @param time Slot time in HH:mm or HH:mm:ss format.
 * @returns The ISO datetime string.
 */
export function buildSlotDateTime(date: string, time: string): string {
  const day = date.slice(0, 10);
  const normalizedTime = time.length === 5 ? `${time}:00` : time.slice(0, 8);
  return `${day}T${normalizedTime}${COLOMBIA_UTC_OFFSET}`;
}
