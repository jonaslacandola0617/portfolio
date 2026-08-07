import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants=cva("inline-flex items-center justify-center gap-2 whitespace-nowrap border text-sm font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"border-border-strong bg-text text-surface hover:opacity-85",secondary:"border-border bg-surface-2 text-text hover:border-border-strong",outline:"border-border bg-transparent text-text hover:border-border-strong",ghost:"border-transparent bg-transparent text-text-dim hover:border-border hover:text-text",link:"border-transparent p-0 text-cobalt underline underline-offset-4",destructive:"border-vermilion bg-vermilion text-white hover:opacity-85"},size:{default:"h-10 px-4 py-2",sm:"h-8 px-3 text-xs",lg:"h-11 px-5",icon:"h-9 w-9 p-0"}},defaultVariants:{variant:"default",size:"default"}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,asChild=false,...props},ref)=>{const Comp=asChild?Slot:"button";return <Comp className={cn(buttonVariants({variant,size,className}))} ref={ref} {...props}/>});
Button.displayName="Button";
export {Button,buttonVariants};
