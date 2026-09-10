import Link from "next/link"
import { ThemedHeading } from "@/components/themed/ThemedHeading"
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"

export default function ForgotPasswordPage() {
  return <main className="min-h-screen bg-background px-4 py-12"><div className="mx-auto flex max-w-md flex-col items-center gap-6"><div className="space-y-2 text-center"><ThemedHeading>Reset Your Password</ThemedHeading><p className="text-sm text-muted-foreground">We will email a secure password reset link.</p></div><ForgotPasswordForm /><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Return to login</Link></div></main>
}
