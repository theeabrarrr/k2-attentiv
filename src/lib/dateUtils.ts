import { format as formatFns, parse } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Karachi";

/**
 * Convert a date to Asia/Karachi timezone
 */
export const toKarachiTime = (date: Date): Date => {
  return toZonedTime(date, TIMEZONE);
};

/**
 * Convert a date from Asia/Karachi timezone to UTC
 */
export const fromKarachiTime = (date: Date): Date => {
  return fromZonedTime(date, TIMEZONE);
};

/**
 * Format a date in Asia/Karachi timezone
 */
export const formatInKarachi = (date: Date, formatStr: string): string => {
  const zonedDate = toKarachiTime(date);
  return formatFns(zonedDate, formatStr);
};

/**
 * Format date as YYYY-MM-DD in Asia/Karachi timezone
 */
export const formatDateForDB = (date: Date): string => {
  return formatInKarachi(date, "yyyy-MM-dd");
};

/**
 * Parse a date string and convert to Asia/Karachi timezone
 */
export const parseKarachiDate = (dateString: string, formatStr: string = "yyyy-MM-dd"): Date => {
  const parsed = parse(dateString, formatStr, new Date());
  return toKarachiTime(parsed);
};

/**
 * Get current date in Asia/Karachi timezone
 */
export const getCurrentKarachiDate = (): Date => {
  return toKarachiTime(new Date());
};
