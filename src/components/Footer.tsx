import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, ShieldCheck, CreditCard, Zap, Truck } from 'lucide-react';
import { useCategoriesWithChildren } from '@/hooks/usePublicCategories';
import { usePublicStoreSettings } from '@/hooks/usePublicStoreSettings';
import { Skeleton } from '@/components/ui/skeleton';
import logoImage from '@/assets/logo.png';

export function Footer() {
  const { parentCategories, isLoading: categoriesLoading } = useCategoriesWithChildren();
  const { data: settings, isLoading: settingsLoading } = usePublicStoreSettings();

  const storeName = settings?.store_name || 'Loja';
  const storeDescription = settings?.store_description || '';
  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const city = settings?.city || '';
  const state = settings?.state || '';
  const instagramUrl = settings?.instagram_url || '';
  const facebookUrl = settings?.facebook_url || '';
  const youtubeUrl = settings?.youtube_url || '';
  const maxInstallments = settings?.max_installments || 12;
  const pixDiscount = Number(settings?.pix_discount_percent) || 5;

  return (
    <footer className="bg-foreground text-background mt-auto">

      {/* Main footer */}
      <div className="container-shop py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* About */}
          <div className="sm:col-span-2 lg:col-span-1">
            {settingsLoading ? (
              <Skeleton className="h-10 w-32 mb-4 bg-background/10" />
            ) : (
              <img
                src={settings?.store_logo || logoImage}
                alt={storeName}
                className="h-10 object-contain mb-4 brightness-0 invert"
              />
            )}
            <p className="text-sm text-background/60 mb-5 leading-relaxed max-w-xs">
              {storeDescription || 'Produtos de qualidade com entrega para todo o Brasil.'}
            </p>
            <div className="flex gap-2.5">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/80">Departamentos</h3>
            <ul className="space-y-2.5">
              {categoriesLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <li key={i}><Skeleton className="h-4 w-24 bg-background/10" /></li>
                ))
              ) : (
                parentCategories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/categoria/${cat.slug}`} className="text-sm text-background/60 hover:text-primary transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Institutional */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/80">Institucional</h3>
            <ul className="space-y-2.5">
              {['Quem Somos', 'Perguntas Frequentes', 'Política de Privacidade', 'Política de Entrega', 'Trocas e Devoluções'].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} className="text-sm text-background/60 hover:text-primary transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/80">Contato</h3>
            <ul className="space-y-3">
              {phone && (
                <li className="flex items-start gap-2.5 text-sm text-background/60">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2.5 text-sm text-background/60">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{email}</span>
                </li>
              )}
              {(city || state) && (
                <li className="flex items-start gap-2.5 text-sm text-background/60">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{[city, state].filter(Boolean).join(', ')} - Brasil</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="container-shop py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40 text-center sm:text-left">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-success/20 text-success px-2.5 py-1 rounded-lg">PIX</span>
            <span className="text-xs text-background/40">Visa • Mastercard • Amex</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
