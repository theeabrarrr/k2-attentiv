import { z } from "zod";

export const fuelCSVRowSchema = z.object({
  email: z.string().email("Invalid email format"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  job_no: z.string().min(1, "Job No is required"),
  area: z.string().min(1, "Area is required"),
  km: z.string().regex(/^\d+(\.\d+)?$/, "KM must be a valid number"),
});

export type FuelCSVRow = z.infer<typeof fuelCSVRowSchema>;

export const validateCSVRow = (row: any, lineNumber: number): { success: boolean; error?: string } => {
  try {
    fuelCSVRowSchema.parse(row);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(", ");
      return { 
        success: false, 
        error: `Line ${lineNumber}: ${errorMessages}` 
      };
    }
    return { 
      success: false, 
      error: `Line ${lineNumber}: Unknown validation error` 
    };
  }
};
