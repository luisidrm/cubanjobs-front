import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Pill status labels. Application / order status mapping from the design system:
// pending = warning, reviewed = info, accepted = success, rejected = destructive, withdrawn = neutral.
const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-4 focus-visible:ring-ring/45 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-(--accent-hover)",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        success: "bg-success-soft text-success-text",
        warning: "bg-warning-soft text-warning-text",
        info: "bg-info-soft text-info-text",
        destructive: "bg-danger-soft text-danger-text [a]:hover:bg-danger-soft",
        outline: "border-border text-foreground [a]:hover:bg-fill-1",
        ghost: "bg-fill-1 text-muted-foreground [a]:hover:bg-fill-2",
        link: "text-accent-text underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
