
import { supabase } from "./integrations/supabase/client";

async function checkColumns() {
  const { data, error } = await supabase.from('produtos').select('*').limit(1);
  if (error) {
    console.error("Error fetching columns:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Columns available:", Object.keys(data[0]));
  } else {
    // If no data, try to get column info from information_schema via a raw query if possible, 
    // but usually checking the first row is enough if we have seeds.
    console.log("No data in produtos table to infer columns.");
  }
}

checkColumns();
