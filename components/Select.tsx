import { cn } from "@/lib/utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-body opacity-inactive block">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full p-4 border border-black/10 rounded-card text-body",
          "focus:outline-none focus:border-accent transition-colors",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "bg-white",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

