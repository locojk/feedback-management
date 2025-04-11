import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../utils"
import "./button.css"

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const classes = cn(
      'button',
      `button-${variant}`,
      size !== 'default' && `button-${size}`,
      className
    )

    return (
      <Comp
        className={classes}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button } 