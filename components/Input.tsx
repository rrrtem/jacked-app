import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-body opacity-inactive block">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full p-4 border border-black/10 rounded-card text-body",
          "focus:outline-none focus:border-accent transition-colors",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    </div>
  );
}

