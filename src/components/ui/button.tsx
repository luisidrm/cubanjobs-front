import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Design-system buttons: pill shape, 32/44/52 heights, accent glow on primary,
// 0.97 press scale with a spring return, 4px focus halo.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-[15px] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap transition-[background-color,transform,box-shadow] duration-200 ease-spring outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/45 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:bg-fill-1 disabled:text-text-3 disabled:opacity-60 disabled:shadow-none aria-invalid:ring-4 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-accent hover:bg-(--accent-hover) active:bg-(--accent-press) active:shadow-none",
        outline:
          "bg-fill-1 text-foreground hover:bg-fill-2 aria-expanded:bg-fill-2 active:bg-fill-3",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--primary)_12%)] aria-expanded:bg-secondary",
        glass: "glass text-foreground hover:bg-(--surface-glass-strong)",
        ghost:
          "text-foreground hover:bg-fill-1 aria-expanded:bg-fill-1 active:bg-fill-2",
        destructive:
          "bg-danger-soft text-danger-text hover:bg-danger-soft focus-visible:ring-destructive/25",
        link: "text-accent-text underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-[18px] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-[52px] gap-2 px-[22px] text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-[52px] [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
