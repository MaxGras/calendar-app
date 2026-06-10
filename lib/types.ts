export type Role = "admin" | "sales_manager" | "developer"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
  color: string
  created_at: string
}

export interface Call {
  id: string
  developer_id: string
  created_by: string | null
  title: string
  call_link: string
  vacancy_link: string
  salary: string
  start_time: string
  end_time: string
  created_at: string
}

export interface CallWithDeveloper extends Call {
  developer: Pick<Profile, "id" | "full_name" | "email"> | null
  creator?: Pick<Profile, "id" | "full_name" | "email" | "color"> | null
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  developer: "Developer",
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "sales_manager":
      return "/manager"
    case "developer":
      return "/developer"
  }
}
