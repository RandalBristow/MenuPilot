import { StaffOrdersPage } from "@/features/staff-orders/components/StaffOrdersPage"

// This legacy route resolves its demo tenant from the database. It cannot be
// prerendered safely because deployment environments may not contain that
// seeded tenant/location.
export const dynamic = "force-dynamic"

export default function StaffOrdersRoutePage() {
  return <StaffOrdersPage isLegacy />
}
