import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPaymentStatusLabel, type PaymentStatus } from "@/types/admin";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  chargeback: "bg-destructive/10 text-destructive border-destructive/20",
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status], className)}
    >
      {getPaymentStatusLabel(status)}
    </Badge>
  );
}
