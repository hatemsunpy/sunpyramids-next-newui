"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------------------------------
 * Highlight Context (Signature Animate-UI Floating Highlight)
 * -----------------------------------------------------------------------------------------------*/

interface HighlightContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  layoutId: string;
}

const HighlightContext = React.createContext<HighlightContextValue | null>(null);

function useHighlight() {
  return React.useContext(HighlightContext);
}

/* -------------------------------------------------------------------------------------------------
 * DropdownMenu Root & Trigger
 * -----------------------------------------------------------------------------------------------*/

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuContent
 * -----------------------------------------------------------------------------------------------*/

interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  className?: string;
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, sideOffset = 6, align = "start", children, ...props }, ref) => {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const layoutId = React.useId();

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        asChild
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "animate-ui-dropdown-content",
            "z-50 min-w-[12rem] overflow-x-hidden overflow-y-auto rounded-2xl p-1.5 shadow-2xl outline-none backdrop-blur-md",
            className
          )}
          onPointerLeave={() => setHoveredId(null)}
        >
          <HighlightContext.Provider value={{ hoveredId, setHoveredId, layoutId }}>
            {children}
          </HighlightContext.Provider>
        </motion.div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItem
 * -----------------------------------------------------------------------------------------------*/

interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
  active?: boolean;
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, inset, variant = "default", active, disabled, children, ...props }, ref) => {
  const highlight = useHighlight();
  const itemId = React.useId();
  const isHovered = highlight?.hoveredId === itemId;

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      disabled={disabled}
      className={cn(
        "animate-ui-dropdown-item relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors duration-150",
        inset && "pl-8",
        disabled && "pointer-events-none opacity-40",
        variant === "destructive" && "text-red-500 hover:text-red-600",
        active && "is-active",
        className
      )}
      onPointerEnter={() => !disabled && highlight?.setHoveredId(itemId)}
      {...props}
    >
      {isHovered && !disabled && (
        <motion.span
          layoutId={highlight?.layoutId}
          className="animate-ui-dropdown-highlight absolute inset-0 -z-10 rounded-xl"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      {children}
    </DropdownMenuPrimitive.Item>
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuCheckboxItem
 * -----------------------------------------------------------------------------------------------*/

interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> {}

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, disabled, ...props }, ref) => {
  const highlight = useHighlight();
  const itemId = React.useId();
  const isHovered = highlight?.hoveredId === itemId;

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "animate-ui-dropdown-item relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm font-medium outline-none transition-colors",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      checked={checked}
      disabled={disabled}
      onPointerEnter={() => !disabled && highlight?.setHoveredId(itemId)}
      {...props}
    >
      {isHovered && !disabled && (
        <motion.span
          layoutId={highlight?.layoutId}
          className="animate-ui-dropdown-highlight absolute inset-0 -z-10 rounded-xl"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuRadioItem
 * -----------------------------------------------------------------------------------------------*/

interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> {}

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(({ className, children, disabled, ...props }, ref) => {
  const highlight = useHighlight();
  const itemId = React.useId();
  const isHovered = highlight?.hoveredId === itemId;

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "animate-ui-dropdown-item relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm font-medium outline-none transition-colors",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      disabled={disabled}
      onPointerEnter={() => !disabled && highlight?.setHoveredId(itemId)}
      {...props}
    >
      {isHovered && !disabled && (
        <motion.span
          layoutId={highlight?.layoutId}
          className="animate-ui-dropdown-highlight absolute inset-0 -z-10 rounded-xl"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuLabel, Separator, Shortcut
 * -----------------------------------------------------------------------------------------------*/

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "animate-ui-dropdown-label px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("animate-ui-dropdown-separator my-1.5 h-px", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubTrigger & SubContent
 * -----------------------------------------------------------------------------------------------*/

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, disabled, ...props }, ref) => {
  const highlight = useHighlight();
  const itemId = React.useId();
  const isHovered = highlight?.hoveredId === itemId;

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      disabled={disabled}
      className={cn(
        "animate-ui-dropdown-item relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium outline-none",
        inset && "pl-8",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      onPointerEnter={() => !disabled && highlight?.setHoveredId(itemId)}
      {...props}
    >
      {isHovered && !disabled && (
        <motion.span
          layoutId={highlight?.layoutId}
          className="animate-ui-dropdown-highlight absolute inset-0 -z-10 rounded-xl"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    asChild
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -4 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "animate-ui-dropdown-content z-50 min-w-[10rem] overflow-hidden rounded-2xl p-1.5 shadow-2xl outline-none backdrop-blur-md",
        className
      )}
    />
  </DropdownMenuPrimitive.SubContent>
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
};
