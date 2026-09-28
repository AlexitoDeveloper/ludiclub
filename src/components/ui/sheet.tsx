import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-250 ease-drawer data-[state=closed]:duration-180",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 flex flex-col bg-card text-card-foreground border-border/80 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out duration-250 ease-drawer data-[state=closed]:duration-180",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top rounded-b-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_-1px_0_0_rgba(255,255,255,0.06)]",
        bottom:
          "inset-x-0 bottom-0 border-t rounded-t-2xl sm:rounded-2xl sm:border sm:bottom-4 max-h-[92vh] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom mx-auto max-w-lg overflow-hidden dark:border-white/[0.08] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.07)] sm:dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.07)]",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left dark:border-white/[0.08]",
        right:
          "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right dark:border-white/[0.08]",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showGrabHandle?: boolean
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "bottom", className, children, showGrabHandle = true, onOpenAutoFocus, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      onOpenAutoFocus={(e) => {
        if (onOpenAutoFocus) {
          onOpenAutoFocus(e)
        } else {
          e.preventDefault()
        }
      }}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {side === "bottom" && showGrabHandle && (
        <div
          aria-hidden="true"
          className="pt-2.5 pb-2 flex justify-center w-full shrink-0 select-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 bg-border/80 dark:bg-white/20 rounded-full" />
        </div>
      )}
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-3.5 rounded-xl border border-border/60 dark:border-white/10 bg-surface-void/50 text-muted-foreground hover:text-foreground hover:bg-surface-elevated hover:border-border transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:pointer-events-none active:translate-y-[1px] p-1.5 z-20">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-6 pt-1 pb-4 flex flex-col space-y-1.5 text-left border-b border-border/60 dark:border-white/[0.06] shrink-0",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-1 overflow-y-auto px-6 py-5 space-y-5 overscroll-contain",
      className
    )}
    {...props}
  />
))
SheetBody.displayName = "SheetBody"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-6 py-4 border-t border-border/60 dark:border-white/[0.06] bg-surface-void/30 dark:bg-surface-void/40 backdrop-blur-md flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-black font-display tracking-tight text-foreground flex items-center gap-2", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
