import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = path.join(__dirname, "../.env.local")
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found!")
  process.exit(1)
}

const env: Record<string, string> = {}
fs.readFileSync(envPath, "utf-8")
  .split("\n")
  .forEach((line) => {
    const [key, ...valueParts] = line.split("=")
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim()
    }
  })

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials in .env.local")
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TestUser {
  email: string
  password: string
  fullName: string
  role: "developer" | "sales_manager"
}

const testUsers: TestUser[] = [
  {
    email: "alice@example.com",
    password: "password123",
    fullName: "Alice Developer",
    role: "developer",
  },
  {
    email: "bob@example.com",
    password: "password123",
    fullName: "Bob Developer",
    role: "developer",
  },
  {
    email: "charlie@example.com",
    password: "password123",
    fullName: "Charlie Developer",
    role: "developer",
  },
  {
    email: "diana@example.com",
    password: "password123",
    fullName: "Diana Sales Manager",
    role: "sales_manager",
  },
  {
    email: "evan@example.com",
    password: "password123",
    fullName: "Evan Sales Manager",
    role: "sales_manager",
  },
]

async function createTestUsers() {
  console.log("╔════════════════════════════════════════════════════════╗")
  console.log("║         CallDesk Database Seed                          ║")
  console.log("╚════════════════════════════════════════════════════════╝\n")

  console.log("✅ Credentials loaded")
  console.log("📍 Project:", supabaseUrl)
  console.log("")

  console.log("👤 Creating test users...\n")

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      })

      if (error) {
        if (error.message.includes("already exists")) {
          console.log(`⚠️  ${user.email} already exists`)
        } else {
          throw error
        }
      } else if (data.user) {
        console.log(`✅ Created ${user.email} (${user.role})`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error(`❌ Failed to create ${user.email}:`, errorMessage)
    }
  }

  console.log("")
  console.log("╔════════════════════════════════════════════════════════╗")
  console.log("║              ✅ Seeding Complete!                      ║")
  console.log("╚════════════════════════════════════════════════════════╝\n")

  console.log("📚 Test Accounts:\n")
  console.log("  admin@example.com          / admin123456       (Admin)")
  console.log("  alice@example.com          / password123       (Developer)")
  console.log("  bob@example.com            / password123       (Developer)")
  console.log("  charlie@example.com        / password123       (Developer)")
  console.log("  diana@example.com          / password123       (Sales Manager)")
  console.log("  evan@example.com           / password123       (Sales Manager)\n")

  console.log("🚀 Next steps:")
  console.log("   1. npm run dev")
  console.log("   2. Login to http://localhost:3000\n")
}

createTestUsers().catch((error) => {
  console.error("\n❌ Seed failed:", error)
  process.exit(1)
})
