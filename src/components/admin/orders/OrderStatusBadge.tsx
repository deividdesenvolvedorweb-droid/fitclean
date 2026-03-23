import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getOrderStatusLabel, type OrderStatus } from "@/types/admin";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusStyles: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  canceled: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-muted text-muted-foreground border-border",
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status], className)}
    >
      {getOrderStatusLabel(status)}
    </Badge>
  );
}
