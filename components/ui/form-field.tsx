"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  id: string
  label: string
  description?: string
  error?: string
  className?: string
  children: ReactNode
}

export function FormField({
  id,
  label,
  description,
  error,
  className,
  children
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between">
        <label 
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
      
      {description && (
        <p className="text-[0.8rem] text-muted-foreground">
          {description}
        </p>
      )}
      
      {children}
      
      {error && (
        <p className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}