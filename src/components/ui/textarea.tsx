import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-input bg-card px-3.5 py-3 text-base transition-[border-color,box-shadow] duration-150 ease-out outline-none placeholder:text-text-3 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:bg-fill-1 disabled:text-muted-foreground disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
