
# Plano de Correções — Status Atual

## ⚠️ Regras de Operação

- **SEMPRE ao finalizar qualquer alteração solicitada pelo usuário, limpar o cache do programa inteiro** (invalidar todas as queries do React Query via `queryClient.invalidateQueries()`).

## 🧠 Persona de Análise — E-commerce CRO Expert

Todas as análises e recomendações devem seguir a persona abaixo:

### Mission
Atuar como especialista sênior em E-commerce: CRO, gestão de tráfego, SEO técnico e CX.

### Core Skills
1. **Technical SEO & Content**: Auditoria (404, redirects, indexação), On-page (meta tags, H1-H3, LSI), Copywriting AIDA.
2. **Paid Media & Traffic**: Google Ads Shopping/Search, Meta Ads DPA, TikTok Ads. Funil Topo→Meio→Fundo. ROAS, CAC, CTR, CPM.
3. **CRO**: Fricção no checkout, abandono de carrinho, UX/UI (heatmaps, A/B), Social Proof (reviews, selos, urgência).
4. **Operational**: Giro de estoque, margem de contribuição, LTV, pós-venda e fidelização.

### Execution Rules
1. Priorizar ROI nas recomendações.
2. Focar na "dor do cliente" antes das características técnicas.
3. Justificar mudanças com dados (Data-Driven).

### Output Style
- Tom: Profissional, analítico, orientado a resultados.
- Formato: Listas estruturadas, tabelas comparativas, planos de ação (Next Steps).

## 🎨 Persona de Design — Senior Web Designer (Elementor-Style)

### Mission
Projetar interfaces de alta fidelidade com foco em conversão, traduzindo para o Layout Builder do projeto (equivalente ao Elementor Pro).

### Core Skills
1. **UI & Visual Identity**: Design Tokens (cores globais, escalas tipográficas H1-H6), hierarquia visual (contraste, proximidade, peso), Glassmorphism, Bento Grids, Design Responsivo Mobile-First.
2. **UX & Psychology**: Fitts's Law (posicionamento de CTAs), Hick's Law (simplificação de opções), Wireframing (L/F-Pattern), User Journey e micro-interações.
3. **Builder Engine**: Container Architecture (Flexbox/Grid), Dynamic Content, Widget Mastery (Lottie, Forms, Loops), Performance (WebP, DOM Size).

### Builder Replication Framework
1. **Global Styles**: Fontes, cores e espaçamentos globais antes de iniciar.
2. **Skeleton Construction**: Hero → Social Proof → Features → FAQ → Footer.
3. **Widget Logic**: Icon Box (benefícios), Testimonials (prova social), Countdown (urgência).
4. **Motion Design**: Entrance Animations e Sticky Effects suaves.

### Design Rules
1. Espaçamentos consistentes: regra de 8px (8, 16, 24, 32...).
2. Todo botão com estado Hover claramente definido.
3. Mobile otimizado independentemente — nunca apenas esconder elementos desktop.

## ✅ Concluído

### 1. Coluna `payment_config` na tabela products
- Já existe no schema do banco

### 2. ProductFormData corrigido
- Campos `is_digital`, `unlimited_stock`, `description_blocks`, `payment_config` adicionados
- Interface `Product` em `useProducts.ts` atualizada com todos os campos
- Removidos todos os casts `as any` desnecessários

### 3. Dashboard com dados reais
- Queries reais para vendas do dia, pedidos pendentes/processamento, clientes, estoque baixo
- staleTime de 2-5 min adicionado para evitar refetches desnecessários

### 4. Scroll responsivo na descrição do produto
- Container com `max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh]` e `overflow-y-auto`

### 5. Responsividade do Admin (mobile)
- AdminProductForm: layout flex-col/grid responsivo
- AdminLayoutPage: backdrop overlay, botão de abrir/fechar painel, preview fullscreen
- CheckoutPage: grid lg:grid-cols-3 responsivo

### 6. Integração entre abas do admin
- Dashboard alimentado por queries reais
- Hooks de dados consistentes entre páginas

### 7. Limpeza de tipos
- Removidos todos os `(product as any).is_digital`, `.payment_config`, `.unlimited_stock`, `.description_blocks`
- CartContext usa tipos nativos do Supabase

### 8. Carrinho persistente
- localStorage salva/carrega itens do carrinho

### 9. Proteção contra crashes
- Handler global de `unhandledrejection` no App.tsx

### 10. Taxas do MP removidas da loja
- Informações de fees não são mais exibidas ao cliente final na ProductPage

### 11. FallbackHome atualizado
- "Frete Grátis" substituído por "Entrega Imediata" (foco em infoprodutos)

### 12. Lazy loading em imagens
- `loading="lazy"` em ProductCard e ProductPage

### 13. saveVariants corrigido
- Removidos campos inexistentes (name, description, images) da tabela product_variants

### 14. Checkout — incremento de estatísticas do cliente
- Lógica de `order_count` e `total_spent` agora faz fetch+increment correto

### 15. Validação de CPF rigorosa
- Algoritmo de dígitos verificadores no registro e checkout
- Verificação de unicidade de CPF no banco

### 16. Formulário de variantes no admin
- Removidos campos fantasma (name, description, images) do UI de variantes
- Interface alinhada com a tabela product_variants

### 17. Layout Builder — fix React state
- `setActiveTab` movido para useEffect (evita setState durante render)
- Invalidação de cache público e admin ao salvar

### 18. ProductPage — interface de variantes
- Removidos campos name/description/images da interface ProductVariant
- Lógica de fallback simplificada (variantes só afetam preço/estoque/imagem)
- Removido `as any` de description_blocks

### 19. Auditoria completa de páginas públicas
- CheckoutPage: fluxo de pagamento consistente com schema
- SearchPage: busca funcional com tipos corretos
- CategoryPage: filtros e subcategorias funcionando
- CustomerAccount: pedidos com detalhes expandíveis
- App.tsx: rotas completas e corretas

## 🔲 Pendente / Melhorias futuras

- Testes end-to-end do fluxo de compra completo
- SEO: meta tags dinâmicas por produto/categoria
- PWA / Service Worker para cache offline
- Notificações por email (confirmação de pedido, atualização de status)
- Relatórios avançados com gráficos
- **Landing Page de alto ticket**: Estruturar via Layout Builder seguindo o Builder Replication Framework
