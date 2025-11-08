import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-8 py-4 text-body rounded-button transition-opacity hover:opacity-80 disabled:opacity-30",
        {
          "bg-accent text-white": variant === "primary",
          "bg-secondary text-black": variant === "secondary",
          "border border-black/10 text-black": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

