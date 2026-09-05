# Terraço Urbano Bar e Restaurante — Site Oficial

Site one-page profissional, responsivo e focado em conversão (reserva via WhatsApp, cardápio, como chegar, delivery e eventos) para o **Terraço Urbano** na Zona Norte de São Paulo.

---

## 1. Estrutura de arquivos

```
terracourbano/
├── index.html              → Página única com todas as seções
├── 404.html                → Página de erro 404 (identidade do site)
├── privacy.html            → Política de Privacidade (LGPD)
├── termos.html             → Termos de Uso
├── robots.txt              → Controle de rastreamento do Google
├── sitemap.xml             → Sitemap (preencher URL)
├── .env.example            → Documentação de configuração/segurança
├── css/
│   └── styles.css          → Toda a estilização (mobile-first)
├── js/
│   └── main.js             → Menu, eventos, lightbox, WhatsApp, analytics, etc.
├── data/                   → CONTEÚDO EDITÁVEL SEM PROGRAMAR
│   ├── site.json           → Contato, endereço, horários, analytics, delivery
│   ├── menu.json           → Cardápio (categorias + itens + preços)
│   ├── events.json         → Eventos
│   └── reviews.json        → Avaliações reais do Google (carrossel)
└── assets/
    └── images/             → Fotos (logo, hero, galeria, instagram, etc.)
```

## 2. Como publicar

O site é **estático** — basta enviar pasta em qualquer hospedagem (Netlify, Vercel, Hostinger, AWS S3, cPanel...). Ele precisa ser servido por HTTP (não abrir direto pelo `file://`), pois os dados de cardápio são carregados via `fetch()`.

Para testar localmente na sua máquina:

```bash
# com Node.js instalado
npx serve
# abre em http://localhost:3000
```

## 3. O QUE PRECISA SER PREENCHIDO ANTES DA PUBLICAÇÃO

Tudo que contém `[INSERIR ...]` no código e **não foi inventado** precisa ser confirmado com o cliente:

### 3.1 `data/site.json` — informações essenciais
| Campo | O que é | Status |
|---|---|---|
| `url` | Endereço final do site | [INSERIR] |
| `phone` | Telefone oficial — `(11) 2288-1005` | ✅ preenchido |
| `whatsapp` | WhatsApp confirmado — `551122881005` | ✅ preenchido |
| `address.*` | `R. Maj. João Nunes, 96` / `02046-070` | ✅ preenchido |
| `plusCode` | `G94Q+XP` | ✅ preenchido |
| `rating` / `reviewCount` | `4.3` / `712` (Google) | ✅ preenchido |
| `priceRange` | `R$ 40-140 por pessoa` | ✅ preenchido |
| `coordinates` | Lat/Long para o mapa | 🔶 pendente |
| `googleMapsEmbed` | Embed do Google Maps (já aplicado sem chave) | ✅ preenchido |
| `hours.*` | Horários reais por dia (ex: `"18:00 - 23:00"`) | 🔶 pendente |
| `delivery.*` | iFood: URL OFICIAL do Terraço (já aplicada) | ✅ preenchido |

> **✓ WhatsApp confirmado** — `551122881005` (formato digital, sem espaço). Todos os botões
> de contato já abrem `wa.me/551122881005` com a mensagem pronta; o ícone flutuante usa o
> WhatsApp e o formulário de reserva envia a mensagem por esse canal.

### 3.2 `index.html`
- `title` / meta `description` — já atualizados com dados reais
- `[INSERIR URL FINAL DO SITE]` (canonical + og:url + schema)
- `[INSERIR URL DA IMAGEM PRINCIPAL]` (og:image)
- JSON-LD: telefone, endereço, faixa de preço e nota Google **já preenchidos**; faltam horários e geo
- Endereço na seção Reservas, Localização, Footer e JSON-LD → ✅ `R. Maj. João Nunes, 96`
- Estatísticas da seção Sobre → ✅ `4,3★` / `+700 avaliações` / `R$ 40–140`; falta `[xx]` anos de história
- Avaliações reais (seção Avaliações) → carrossel alimentado por `data/reviews.json`; **nunca inventar** — enquanto o arquivo estiver vazio, o site mostra "as avaliações reais entram em breve"
- Google Maps → embed sem chave já aplicado nas seções **Reservas** e **Localização** (não usa API key)

### 3.3 `data/menu.json`
Preencher itens reais por categoria (nome, descrição, preço, foto). Sem item preenchido, o site exibe avisos automáticos ("Em breve").

### 3.4 `data/events.json`
Adicionar eventos reais com data (`YYYY-MM-DD`), horário, artista e foto.

### 3.5 Imagens
Substituir os SVG placeholder em `assets/images/` pelas fotos reais em **WebP/AVIF** (largura ≤ 1200px). Recomendado: Galeria, Hero ambiente, Sobre, Instagram.

## 4. Como atualizar o conteúdo (sem programar)

### Cardápio
Editar `data/menu.json`. Para **cada item**:
```json
{
  "id": "p1",
  "name": "Nome do prato",
  "description": "Descrição curta",
  "price": "R$ 0,00",
  "image": "assets/images/menu/nome-do-prato.webp",
  "featured": false,
  "tags": ["Novo", "Picante"]
}
```
- Para destacar um item, use `"featured": true` (aparece com selo "Destaque").
- Para imagem, crie o arquivo e aponte o caminho em `image`.
- Para adicionar categoria nova, copie um bloco `{ "id": "...", "name": "...", "items": [] }`.

### Eventos
Editar `data/events.json`. Cada evento:
```json
{
  "id": "ev3",
  "title": "Nome do evento",
  "artist": "Artista/ DJ (opcional)",
  "date": "2026-10-15",
  "time": "20:00",
  "description": "Descrição",
  "image": "assets/images/events/evento.webp",
  "featured": true,
  "category": "musica"
}
```
- Evento recorrente? Use `"date": "every-saturday"`.

### Avaliações (Google)
Editar `data/reviews.json` — **usar apenas avaliações reais e autorizadas pelo cliente**:
```json
[
  {
    "name": "Nome do cliente (Google)",
    "rating": 5,
    "text": "Texto exato da avaliação pública",
    "photo": ""
  }
]
```
- `rating`: de `1` a `5` (estrelas exibidas no card).
- `photo`: URL da foto de perfil (opcional; sem foto, o site gera um avatar com a inicial).
- O carrossel mostra os cards em loop infinito com arraste em touch/mouse; **nunca inventar** depoimentos. Enquanto a lista estiver vazia (`[]`), o site exibe aviso honesto.

### Horários, contato e delivery
Editar `data/site.json`. O site já mostra **"Aberto agora / Fechado agora"** automaticamente com base nos horários informados. O delivery oficial do Terraço Urbano é o **iFood** (seção "Delivery" com CTA "Pedir pelo iFood" — URL real já aplicada).

## 5. Analytics e consentimento (LGPD)

### Consentimento de cookies
O site possui um **banner de consentimento** que segue a LGPD:

- Enquanto o GA4 e o Meta Pixel estiverem com IDs **placeholder**, nenhum script de medição é carregado e o banner **não aparece**.
- Quando IDs **reais** forem configurados (ver abaixo), o banner passa a ser exibido automaticamente, e os scripts só rodam após o visitante clicar em **"Aceitar"**.
- A escolha do visitante fica salva em `localStorage` (`tu-cookie-consent`). "Recusar" mantém os scripts desligados.

### Como ativar a medição
1. **Google Analytics 4** — troque `G-XXXXXXXXXX` pelo ID real **em `index.html`** (existem 3 ocorrências: URL do script, config e placeholder do bloco de consentimento).
2. **Meta Pixel** — troque `[INSERIR META PIXEL ID]` pela ID real em `index.html`.
3. **Google Search Console** — cole o código de verificação no meta tag de `index.html`.
4. Preencha as mesmas informações em `data/site.json` → `analytics`.

**Eventos de conversão automaticamente rastreados** (aparecem no GA4/Pixel):
- Clique em WhatsApp → `whatsapp_click`
- Clique em Telefone (`tel:`) → `phone_click`
- Clique em Delivery (iFood) → `delivery_click`
- Clique no Cardápio → `menu_click`
- Clique em Como Chegar → `directions_click` (inclui o botão do Waze)
- Clique em Reserva → `reservation_click`
- Envio do formulário de reserva → `reservation_submit` (com nome, data, horário, pessoas)
- Clique no Instagram → `instagram_click`

> Os botões de contato (`data-whatsapp`) decidem o canal **automaticamente**: se o WhatsApp
> estiver confirmado em `site.json`, abrem `wa.me` (evento `whatsapp_click`); se não, ligam
> para `tel:` (evento `phone_click`).

## 6. SEO

Já implementado: title, meta description, Open Graph, canonical, sitemap.xml, robots.txt, heading hierarchy, alt text, Schema.org (`BarRestaurant`) com endereço/horários/geo, e palavras-chave locais distribuídas naturalmente (Zona Norte, espaço kids, pet friendly, música ao vivo).

**Pendências para SEO funcionar de verdade:** preencher endereço, horários e nota no JSON-LD + `index.html`, e enviar o `sitemap.xml` no Search Console.

## 7. Performance

- Mobile-first, CSS enxuto, sem frameworks/jquery.
- Imagens nativas com `loading="lazy"` + troca por WebP quando as fotos reais forem inseridas.
- Fontes com `display=swap` e preconnect.
- Zero JavaScript pesado: um único arquivo `main.js`.
- Respeita `prefers-reduced-motion`.

## 8. Página 404

Existe `404.html` com a identidade visual do site (**"Ops! Esse caminho não leva ao Terraço."** + CTA "Voltar ao site"). Não precisa de configuração na maioria das hospedagens estáticas — verifique apenas no Netlify/Vercel que o arquivo `404.html` na raiz já é usado automaticamente (Vercel usa `404.html`; em servidores Apache/Nginx, confirme na configuração).

## 9. Waze

O botão "Abrir rota no Waze" (seção Localização) usa `site.wazeUrl` em `data/site.json`. Formato recomendado:

```
https://waze.com/ul?ll=-23.5,-46.6&navigate=yes
```

Enquanto estiver com placeholder, o botão não navega (fica inerte).

## 10. Consistência com o Google Business Profile (SEO local)

Antes de publicar, o perfil do Google Business precisa bater EXATAMENTE com o site. Abaixo o checklist (NAP = Nome, Endereço, Telefone):

- [ ] **Nome**: idêntico nos dois — `Terraço Urbano Bar e Restaurante`.
- [ ] **Endereço**: `R. Maj. João Nunes, 96 — Jardim São Paulo (Zona Norte) — São Paulo/SP — CEP 02046-070` (já aplicado no site; conferir se bate com o GBP).
- [ ] **Telefone**: `(11) 2288-1005` (já aplicado no site; conferir formato no GBP).
- [ ] **Site**: apontar o GBP para o domínio final (https com o mesmo `canonical` do site).
- [ ] **Horários**: iguais aos de `site.json` — pendente; o site mostra "Aberto agora" baseado neles.
- [ ] **Categoria do negócio**: usar a mesma categoria no GBP e no `servesCuisine`/schema do site.
- [ ] **Fotos**: usar as mesmas fotos reais do site; manter nome de arquivo padronizado (`terracourbano-ambiente.webp`, `terracourbano-drinks.webp`).
- [ ] **Place ID / coordenadas**: conferir em `site.json` para o botão "Abrir rota no Google Maps" (hoje usa URL por endereço).

## 11. Deploy, domínio e HTTPS

O site é estático e publica em qualquer hospedagem:

1. **Domínio**: registrar (ex.: `terracourbano.com.br`, sempre confirmar com o cliente) e apontar o DNS para a hospedagem.
2. **Hospedagem recomendada**: Netlify, Vercel ou Cloudflare Pages (grátis, HTTPS automático) — arraste a pasta do projeto.
3. **HTTPS sempre ativo**: GA4, Meta Pixel, o embed do Maps e o WhatsApp exigem página segura.
4. **Search Console**: conectar o domínio, enviar `sitemap.xml`, pedir indexação e acompanhar desempenho.
5. **Verificação**: usar o meta tag `google-site-verification` já presente no `index.html`.

## 12. `.env.example`

O arquivo `.env.example` documenta toda a configuração (contato, endereço, analytics, delivery) e os cuidados de segurança. Como é um site estático, **não existem segredos em tempo de execução** — jamais coloque chaves de Google Maps JS API no navegador; prefira o **embed sem chave** (iframe), que é o que o site usa.

### Google Maps sem chave (keyless)
As seções Reservas e Localização usam o embed oficial do Google sem API key:

```
https://www.google.com/maps?q=Terra%C3%A7o+Urbano+Bar+e+Restaurante,+R.+Maj.+Jo%C3%A3o+Nunes,+96,+Jardim+S%C3%A3o+Paulo,+S%C3%A3o+Paulo+-+SP,+02046-070&hl=pt-BR&z=16&output=embed
```

- O marcador é gerado automaticamente a partir do endereço em `q`.
- Se no futuro quiser mapas interativos (Maps JavaScript API), use uma chave pública **restringida por domínio/HTTP referrer** e habilite só as APIs usadas — nunca deixe chaves soltas no código público.

## 13. Observações éticas e legais

- **Nunca inventar** preços, pratos, horários, eventos, endereço ou avaliações.
- Toda informação pendente está marcada como `[INSERIR ...]`.
- **WhatsApp confirmado**: `site.json → whatsapp = "551122881005"` — todos os links de `wa.me` e o envio de reservas funcionam por esse canal.
- **Delivery oficial**: apenas **iFood** (URL oficial já aplicada). Não publicar pontos de venda não confirmados (ex.: Rappi/Uber Eats).
- Utilizar somente fotos reais do restaurante (ou com autorização) para ambiente, comidas e público.
- O cookie de consentimento fica inativo até que IDs reais de rastreamento sejam configurados — nunca instalar rastreadores escondidos.

## 14. Estado atual (resumo do que já foi aplicado)

- Dados reais do cliente em `site.json` e `index.html`: telefone, endereço `R. Maj. João Nunes, 96`, CEP, Plus Code `G94Q+XP`, faixa de preço `R$ 40–140`, nota `4,3`/`712`, URL oficial do iFood.
- **Canais de contato inteligentes**: botões `data-whatsapp` resolvem WhatsApp `wa.me` **ou** telefone `tel:` automaticamente (evento `whatsapp_click`/`phone_click`); ícone flutuante vira telefone enquanto o WhatsApp não for confirmado.
- **3 CTAs principais e barra fixa mobile** `[Cardápio] [Reservar] [iFood]` — os botões "Reservar mesa" (hero, CTA-final e barra mobile) rolam até a seção de reservas.
- **Formulário de reserva completo** (nome, data, horário, pessoas, observações): valida campos obrigatórios, monta a mensagem no WhatsApp com `encodeURIComponent` e abre `wa.me/551122881005` sem recarregar a página.
- **Carrossel de avaliações** alimentado por `data/reviews.json` (loop infinito, arraste touch/mouse, pausa ao reduzir movimento). Sem dados reais o carrossel mostra aviso honesto — nenhuma avaliação é inventada.
- **Google Maps keyless** aplicado nas seções Reservas e Localização (embed oficial sem API key, marcador automático no endereço).
- Seção **Delivery** reorganizada para iFood e reposicionada logo após o Cardápio.
- Páginas `privacy.html` e `termos.html` criadas e linkadas no rodapé + aviso de cookies.
- `404.html` com a mensagem nova (`"Ops! Esse caminho não leva ao Terraço."`).

**Pendências para publicação:** horários, ano de fundação (`[xx]`), avaliações reais em `data/reviews.json`, fotos reais, URL final e domínio.