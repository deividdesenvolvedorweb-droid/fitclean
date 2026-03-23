import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coupon, CouponInsert } from "@/hooks/admin/useCoupons";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const couponSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").transform((v) => v.toUpperCase().replace(/\s/g, "")),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number().min(0, "Valor deve ser positivo"),
  min_cart_value: z.number().optional(),
  max_discount: z.number().optional(),
  usage_limit: z.number().optional(),
  usage_per_customer: z.number().default(1),
  stackable: z.boolean().default(false),
  active: z.boolean().default(true),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
}).refine((data) => {
  if (data.type === "percentage" && data.value > 100) return false;
  return true;
}, { message: "Porcentagem não pode ser maior que 100%", path: ["value"] });

type FormData = z.infer<typeof couponSchema>;

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  createCoupon: UseMutationResult<any, Error, CouponInsert>;
  updateCoupon: UseMutationResult<any, Error, any>;
}

export function CouponDialog({ open, onOpenChange, coupon, createCoupon, updateCoupon }: CouponDialogProps) {

  const form = useForm<FormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 0,
      min_cart_value: undefined,
      max_discount: undefined,
      usage_limit: undefined,
      usage_per_customer: 1,
      stackable: false,
      active: true,
      start_at: "",
      end_at: "",
    },
  });

  const couponType = form.watch("type");

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        min_cart_value: coupon.min_cart_value ? Number(coupon.min_cart_value) : undefined,
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : undefined,
        usage_limit: coupon.usage_limit ?? undefined,
        usage_per_customer: coupon.usage_per_customer ?? 1,
        stackable: coupon.stackable,
        active: coupon.active,
        start_at: coupon.start_at ? new Date(coupon.start_at).toISOString().slice(0, 16) : "",
        end_at: coupon.end_at ? new Date(coupon.end_at).toISOString().slice(0, 16) : "",
      });
    } else {
      form.reset({
        code: "",
        type: "percentage",
        value: 0,
        min_cart_value: undefined,
        max_discount: undefined,
        usage_limit: undefined,
        usage_per_customer: 1,
        stackable: false,
        active: true,
        start_at: "",
        end_at: "",
      });
    }
  }, [coupon, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const couponData: CouponInsert = {
        code: data.code,
        type: data.type,
        value: data.value,
        min_cart_value: data.min_cart_value ?? null,
        max_discount: data.max_discount ?? null,
        usage_limit: data.usage_limit ?? null,
        usage_per_customer: data.usage_per_customer,
        stackable: data.stackable,
        active: data.active,
        start_at: data.start_at ? new Date(data.start_at).toISOString() : null,
        end_at: data.end_at ? new Date(data.end_at).toISOString() : null,
      };

      if (coupon) {
        await updateCoupon.mutateAsync({ id: coupon.id, ...couponData });
      } else {
        await createCoupon.mutateAsync(couponData);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation's onError
    }
  };

  const isLoading = createCoupon.isPending || updateCoupon.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="DESCONTO10"
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    />
                  </FormControl>
                  <FormDescription>Código que o cliente irá inserir</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem</SelectItem>
                        <SelectItem value="fixed">Valor Fixo</SelectItem>
                        <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {couponType === "percentage" ? "Desconto (%)" : "Valor (R$)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={couponType === "free_shipping"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_cart_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mínimo do Carrinho</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="R$ 0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {couponType === "percentage" && (
                <FormField
                  control={form.control}
                  name="max_discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto Máximo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Sem limite"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usage_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Uso Total</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Ilimitado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usage_per_customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite por Cliente</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stackable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Acumulável</FormLabel>
                    <FormDescription>
                      Permitir uso com outros cupons
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : coupon ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
