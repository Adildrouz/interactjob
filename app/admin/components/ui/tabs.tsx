"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--ad-radius-md)] bg-[var(--ad-surface-hover)] p-1",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--ad-radius-sm)] px-3.5 py-1.5 text-sm font-medium text-[var(--ad-text-secondary)] transition-all",
        "data-[state=active]:bg-[var(--ad-surface)] data-[state=active]:text-[var(--ad-text)] data-[state=active]:shadow-[var(--ad-shadow-xs)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("ad-anim-in mt-4 focus-visible:outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
