"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Animated icon wrapper for toast icons
const AnimatedIcon = ({
  children,
  type
}: {
  children: React.ReactNode
  type: 'success' | 'error' | 'warning' | 'info'
}) => {
  const animationClass = {
    success: 'animate-[toast-success_0.5s_ease-out]',
    error: 'animate-[toast-error_0.4s_ease-in-out]',
    warning: 'animate-[toast-warning_0.5s_ease-in-out]',
    info: 'animate-[toast-info_0.3s_ease-out]',
  }[type]

  return (
    <span className={animationClass}>
      {children}
    </span>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <AnimatedIcon type="success">
            <CircleCheck className="h-4 w-4 text-green-500" />
          </AnimatedIcon>
        ),
        info: (
          <AnimatedIcon type="info">
            <Info className="h-4 w-4 text-blue-500" />
          </AnimatedIcon>
        ),
        warning: (
          <AnimatedIcon type="warning">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
          </AnimatedIcon>
        ),
        error: (
          <AnimatedIcon type="error">
            <OctagonX className="h-4 w-4 text-red-500" />
          </AnimatedIcon>
        ),
        loading: <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
