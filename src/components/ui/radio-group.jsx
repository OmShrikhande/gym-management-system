import * as React from "react"
import { cn } from "@/lib/utils"

// Simple radio group component that doesn't rely on Radix UI
const RadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <div
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, id, children, checked, onChange, ...props }, ref) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id={id}
        value={value}
        checked={checked}
        onChange={onChange}
        className={cn(
          "h-4 w-4 rounded-full border border-gray-500 bg-gray-700 text-blue-600",
          className
        )}
        {...props}
        ref={ref}
      />
      {children}
    </div>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }