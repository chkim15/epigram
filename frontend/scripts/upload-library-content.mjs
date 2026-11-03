// Uploads .protected-content/library.json to the private library_content table.
// Apply the library_content migration first. Run from frontend/:
//   node --env-file=.env.local scripts/upload-library-content.mjs
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const items = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".protected-content", "library.json"), "utf8"));
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const item of items) {
  const { error } = await admin
    .from("library_content")
    .upsert({ ...item, updated_at: new Date().toISOString() }, { onConflict: "section,slug" });
  if (error) {
    console.error(`${item.section}/${item.slug}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Uploaded ${item.section}/${item.slug}`);
}
