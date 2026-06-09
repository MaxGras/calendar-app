import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const env: Record<string, string> = {};
fs.readFileSync(envPath, "utf-8")
  .split("\n")
  .forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  });

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "developer" | "sales_manager";
}

const users: SeedUser[] = [
  {
    email: "admin@example.com",
    password: "123",
    fullName: "Admin User",
    role: "admin",
  },
  {
    email: "developer@example.com",
    password: "123",
    fullName: "John Developer",
    role: "developer",
  },
  {
    email: "sales@example.com",
    password: "123",
    fullName: "Jane Sales Manager",
    role: "sales_manager",
  },
  {
    email: "sales2@example.com",
    password: "123",
    fullName: "Jane Sales Manager",
    role: "sales_manager",
  },
];

async function cleanDatabase() {
  console.log("🧹 Cleaning database...\n");

  try {
    // Delete all profiles (this cascades to delete calls due to foreign key)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (profileError && !profileError.message.includes("No rows removed")) {
      console.log("⚠️  Could not delete profiles (this is normal if empty)");
    } else {
      console.log("✅ Cleaned profiles table");
    }

    // Delete all auth users
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users?.users) {
      for (const user of users.users) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error && !error.message.includes("not found")) {
          console.warn(`⚠️  Could not delete user ${user.email}:`, error.message);
        }
      }
      console.log(`✅ Deleted ${users.users.length} auth users`);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  Cleanup issue (this is normal):`, errorMessage);
  }

  console.log("");
}

async function createUsers() {
  console.log("👤 Creating users...\n");

  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log(`✅ Created ${user.email} (${user.role})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed to create ${user.email}:`, errorMessage);
      process.exit(1);
    }
  }

  console.log("");
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         CallDesk Database Seed                          ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("✅ Credentials loaded");
  console.log("📍 Project:", supabaseUrl);
  console.log("");

  await cleanDatabase();
  await createUsers();

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║              ✅ Seeding Complete!                      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📚 Test Accounts:\n");
  console.log("  admin@example.com          / admin123456       (Admin)");
  console.log("  developer@example.com      / password123       (Developer)");
  console.log("  sales@example.com          / password123       (Sales Manager)\n");

  console.log("🚀 Next steps:");
  console.log("   1. npm run dev");
  console.log("   2. Login to http://localhost:3000\n");
}

main().catch((error) => {
  console.error("\n❌ Seed failed:", error);
  process.exit(1);
});
