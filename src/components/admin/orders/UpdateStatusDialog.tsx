import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrderStatusLabel, type OrderStatus } from "@/types/admin";

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OrderStatus;
  onUpdate: (
    status: OrderStatus,
    notes?: string,
    trackingCode?: string,
    carrier?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
];

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "canceled"],
  paid: ["processing", "canceled", "refunded"],
  processing: ["shipped", "canceled", "refunded"],
  shipped: ["delivered", "canceled", "refunded"],
  delivered: ["refunded"],
  canceled: [],
  refunded: [],
};

export function UpdateStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onUpdate,
  isLoading,
}: UpdateStatusDialogProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("");

  const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
  const needsTracking = status === "shipped";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsTracking && !trackingCode) return;
    await onUpdate(status, notes || undefined, trackingCode || undefined, carrier || undefined);
    setNotes("");
    setTrackingCode("");
    setCarrier("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Status do Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status Atual</Label>
            <p className="text-sm font-medium">
              {getOrderStatusLabel(currentStatus)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-status">Novo Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as OrderStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    disabled={
                      s === currentStatus || !validNextStatuses.includes(s)
                    }
                  >
                    {getOrderStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsTracking && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tracking">Código de Rastreio *</Label>
                <Input
                  id="tracking"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ex: BR123456789BR"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier">Transportadora</Label>
                <Input
                  id="carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Ex: Correios, Jadlog..."
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da alteração..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                status === currentStatus ||
                (needsTracking && !trackingCode)
              }
            >
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
