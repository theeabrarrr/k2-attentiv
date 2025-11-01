/**
 * Utility functions for custom attendance cycle (26th to 25th)
 */

export interface AttendanceCycle {
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string;   // ISO format YYYY-MM-DD
  label: string;     // Human-readable label
}

/**
 * Get the current attendance cycle based on today's date
 * Cycle runs from 26th of one month to 25th of next month
 */
export const getCurrentAttendanceCycle = (): AttendanceCycle => {
  const today = new Date();
  const currentDay = today.getDate();
  
  let startDate: Date;
  let endDate: Date;
  
  if (currentDay >= 26) {
    // We're in the second half of the month, cycle is from 26th of this month to 25th of next month
    startDate = new Date(today.getFullYear(), today.getMonth(), 26);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 25);
  } else {
    // We're in the first half of the month, cycle is from 26th of last month to 25th of this month
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 26);
    endDate = new Date(today.getFullYear(), today.getMonth(), 25);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label: formatCycleLabel(startDate, endDate)
  };
};

/**
 * Get attendance cycle for a specific offset from current cycle
 * @param offset - Number of cycles to offset (negative for past, positive for future)
 */
export const getAttendanceCycle = (offset: number = 0): AttendanceCycle => {
  const current = getCurrentAttendanceCycle();
  const startDate = new Date(current.startDate);
  
  // Add months to the start date
  startDate.setMonth(startDate.getMonth() + offset);
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(25);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label: formatCycleLabel(startDate, endDate)
  };
};

/**
 * Format cycle label in readable format
 */
const formatCycleLabel = (startDate: Date, endDate: Date): string => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const startMonth = monthNames[startDate.getMonth()];
  const endMonth = monthNames[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  if (startYear === endYear) {
    return `26 ${startMonth} - 25 ${endMonth} ${endYear}`;
  } else {
    return `26 ${startMonth} ${startYear} - 25 ${endMonth} ${endYear}`;
  }
};

/**
 * Generate list of past cycles for selector
 * @param count - Number of past cycles to generate
 */
export const getPastCycles = (count: number = 6): AttendanceCycle[] => {
  const cycles: AttendanceCycle[] = [];
  
  for (let i = 0; i >= -count; i--) {
    cycles.push(getAttendanceCycle(i));
  }
  
  return cycles;
};
