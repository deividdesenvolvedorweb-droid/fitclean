import { useState } from "react";
import { Plus, Edit, Trash2, Calendar, ExternalLink, Image, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBanners, Banner } from "@/hooks/admin/useBanners";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { StatusToggle } from "@/components/admin/shared/StatusToggle";
import { BannerDialog } from "@/components/admin/banners/BannerDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BANNER_TYPE_LABELS: Record<string, string> = {
  home_slider: "Slider Home",
  category: "Categoria",
  promo_bar: "Barra Promo",
  topbar: "Topbar",
};

type ScheduleStatus = "scheduled" | "expired" | "active" | false;

function getScheduleStatus(banner: Banner): ScheduleStatus {
  if (!banner.start_at && !banner.end_at) return false;
  const now = new Date();
  if (banner.start_at && new Date(banner.start_at) > now) return "scheduled";
  if (banner.end_at && new Date(banner.end_at) < now) return "expired";
  return "active";
}

function ScheduleBadge({ status }: { status: ScheduleStatus }) {
  if (!status || status === "active") return null;
  if (status === "scheduled") {
    return (
      <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20">
        <Calendar className="w-3 h-3 mr-1" />
        Agendado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
      Expirado
    </Badge>
  );
}

export default function AdminBanners() {
  const { banners, isLoading, deleteBanner, toggleActive } = useBanners();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredBanners = banners.filter((b) =>
    typeFilter === "all" ? true : b.type === typeFilter
  );

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setDialogOpen(true);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description={`${banners.length} banner${banners.length !== 1 ? "s" : ""} cadastrado${banners.length !== 1 ? "s" : ""}`}
        actionLabel="Novo Banner"
        actionIcon={Plus}
        onAction={handleCreate}
        icon={Image}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(BANNER_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredBanners.length === 0 ? (
        <EmptyState
          title="Nenhum banner encontrado"
          description="Crie seu primeiro banner para exibir na loja"
          actionLabel="Criar Banner"
          onAction={handleCreate}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBanners.map((banner) => {
            const scheduleStatus = getScheduleStatus(banner);

            return (
              <Card key={banner.id} className="overflow-hidden group">
                <div className="aspect-video relative bg-muted">
                  {banner.image_desktop ? (
                    <img
                      src={banner.image_desktop}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Image className="h-8 w-8 opacity-40" />
                    </div>
                  )}

                  {/* Overlay badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                    <Badge variant="secondary" className="text-[11px]">
                      {BANNER_TYPE_LABELS[banner.type] || banner.type}
                    </Badge>
                    <div className="flex gap-1">
                      <ScheduleBadge status={scheduleStatus} />
                      {!banner.active && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-muted">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sort order indicator */}
                  <div className="absolute bottom-2 left-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-muted-foreground">
                      <GripVertical className="h-3 w-3" />
                      #{banner.sort_order}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate text-sm">
                      {banner.title || "Sem título"}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  {(banner.start_at || banner.end_at) && (
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      {banner.start_at && (
                        <div>Início: {format(new Date(banner.start_at), "dd/MM/yy HH:mm", { locale: ptBR })}</div>
                      )}
                      {banner.end_at && (
                        <div>Fim: {format(new Date(banner.end_at), "dd/MM/yy HH:mm", { locale: ptBR })}</div>
                      )}
                    </div>
                  )}

                  {banner.button_link && (
                    <a
                      href={banner.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {banner.button_text || "Ver link"}
                    </a>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <StatusToggle
                      active={banner.active}
                      onToggle={(active) => toggleActive.mutate({ id: banner.id, active })}
                      disabled={toggleActive.isPending}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(banner.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banner={editingBanner}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir Banner"
        description="Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita."
        onConfirm={() => {
          if (deleteId) {
            deleteBanner.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        isLoading={deleteBanner.isPending}
      />
    </div>
  );
}
