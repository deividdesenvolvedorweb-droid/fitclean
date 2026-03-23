import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface StatusToggleProps {
  active: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function StatusToggle({
  active,
  onToggle,
  disabled = false,
  showLabel = true,
  className,
}: StatusToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        checked={active}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium",
            active ? "text-success" : "text-muted-foreground"
          )}
        >
          {active ? "Ativo" : "Inativo"}
        </span>
      )}
    </div>
  );
}
