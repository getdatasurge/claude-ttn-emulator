/**
 * Database type definitions
 * Auto-generated from Supabase schema
 *
 * To regenerate: run `supabase gen types typescript --local > src/integrations/supabase/types.ts`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Table definitions will be added as the schema is developed
    }
    Views: {
      // View definitions will be added as needed
    }
    Functions: {
      // Function definitions will be added as needed
    }
    Enums: {
      // Enum definitions will be added as needed
    }
  }
}
