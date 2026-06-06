"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

type ThemedToastKind = "success" | "error" | "info"

type ThemedToastInput = {
  title: string
  description?: string
  kind?: ThemedToastKind
}

type ThemedToastItem = Required<Pick<ThemedToastInput, "title" | "kind">> & {
  id: string
  description?: string
}

type ThemedToastContextValue = {
  showToast: (toast: ThemedToastInput) => void
}

const ThemedToastContext = createContext<ThemedToastContextValue | null>(null)

function getToastClassName(kind: ThemedToastKind) {
  if (kind === "success") {
    return "border-success/30 bg-success/10 text-foreground"
  }

  if (kind === "error") {
    return "border-destructive/30 bg-destructive/10 text-foreground"
  }

  return "border-border bg-card text-card-foreground"
}

export function ThemedToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ThemedToastItem[]>([])

  const showToast = useCallback((toast: ThemedToastInput) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    setToasts((current) => [
      ...current,
      {
        id,
        title: toast.title,
        description: toast.description,
        kind: toast.kind ?? "info",
      },
    ])
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ThemedToastContext.Provider value={value}>
      <ToastProvider>
        {children}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            className={cn(getToastClassName(toast.kind))}
            open
            onOpenChange={(open) => {
              if (!open) {
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id)
                )
              }
            }}
          >
            <div className="min-w-0">
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description ? (
                <ToastDescription>{toast.description}</ToastDescription>
              ) : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ThemedToastContext.Provider>
  )
}

export function useThemedToast() {
  const context = useContext(ThemedToastContext)

  if (!context) {
    throw new Error("useThemedToast must be used inside ThemedToastProvider.")
  }

  return context
}
