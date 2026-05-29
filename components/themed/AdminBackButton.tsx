"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemedButton } from "@/components/themed/ThemedButton"

type AdminBackButtonProps = {
  fallbackHref: string
  label: string
  className?: string
}

export function AdminBackButton({
  fallbackHref,
  label,
  className = "size-10 bg-background text-foreground hover:bg-muted",
}: AdminBackButtonProps) {
  const router = useRouter()
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  function handleBack() {
    if (!mountedRef.current) return

    if (window.history.length > 1) {
      router.back()
      return
    }

    router.replace(fallbackHref)
  }

  return (
    <ThemedButton
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      className={className}
      onClick={handleBack}
    >
      <X aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </ThemedButton>
  )
}
