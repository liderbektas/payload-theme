# CLAUDE.md — payload-theme

## Proje Nedir

Payload CMS 3.x'in admin panelini **komple yeniden tasarlayan**, npm'e publish edilecek bir theme/UI plugin'i geliştiriyoruz. Paket adı: `payload-theme`.

İlham kaynağı Laravel Filament panelleri: kullanıcı bu paketi kurduğunda Payload'ın varsayılan admin arayüzü; pill şeklinde aktif nav linkleri, ikonlu sidebar, üstünde accent renkli şerit olan yumuşak kartlar, soft/pill input'lar, toggle'a dönüşmüş checkbox'lar ve widget'lı bir dashboard'a sahip modern bir panele dönüşecek. Kullanıcı tek bir **accent rengi** seçtiğinde nav active state'i, butonlar, focus ring'ler, seçili satırlar — tüm interaktif elemanlar o renge göre otomatik boyanacak.

Hedef DX (bundan karmaşık olmayacak):

```ts
plugins: [
  payloadTheme({
    accent: '#e30613',
    preset: 'soft',        // 'soft' | 'noir' | 'minimal'
    radius: 'lg',
    nav: { icons: { posts: 'newspaper', users: 'users' } },
  }),
]
```

+ `custom.scss` içine tek satır CSS import. Toplam kurulum: 2 satır.

## Mimari — 3 Katman

**Katman 1: Theme Engine (renk motoru + token'lar)**
- Kullanıcının verdiği tek accent hex'inden OKLCH uzayında 11 adımlık skala üret (50–950). Sıfır runtime bağımlılık hedefi: OKLCH dönüşümünü kendimiz yazarız, hesap plugin init'te bir kez yapılır, sonuç CSS custom property olarak inject edilir (FOUC olmadan, SSR-safe, mümkün olan en erken noktada).
- Otomatik kontrast: accent üzerine binen text (`--pt-accent-contrast`) WCAG AA'ya göre otomatik siyah/beyaz seçilir (relative luminance). Sarı accent → siyah text, mor accent → beyaz text.
- Dark mode ayrı map'lenir: dark'ta primary olarak skalanın daha parlak adımı kullanılır (light: accent-600, dark: accent-400 gibi). Skala asla düz ters çevrilmez.
- Semantic renkler (error/warning/success) accent'ten BAĞIMSIZ kalır. Disabled state'ler gri kalır.
- Token seti: `--pt-accent-{50..950}`, `--pt-accent`, `--pt-accent-hover`, `--pt-accent-active`, `--pt-accent-subtle`, `--pt-accent-contrast`, `--pt-accent-ring`.
- Preset'ler yüzey/nötr renkleri belirler (accent'ten bağımsız): `soft` (açık, ferah, hafif gri zemin üstünde beyaz kartlar — Filament referansındaki his), `noir` (near-black premium dark), `minimal` (saf beyaz, ince border, düşük shadow). Her preset'in hem light hem dark varyantı olmalı; Payload'ın kendi `data-theme` toggle'ı ile çakışmamalı: `[data-pt-preset='soft'][data-theme='dark']` gibi.

**Katman 2: Restyle Layer (CSS ile component redesign)**
**Görsel referans: shadcn/ui.** Tüm form elemanları, input'lar, select'ler, date picker, dialog/drawer'lar ve butonlar shadcn/ui'ın tasarım dilini hedefler: sakin ve ince border'lar (1px, düşük kontrast), belirgin ama zarif focus ring (2px offset'li accent ring), tutarlı component yükseklikleri (input/button/select aynı boy), yumuşak ama abartısız radius, net hover/active/disabled state ayrımı, `muted` ikincil metin rengi hiyerarşisi. Bu bir DEPENDENCY değil tasarım referansı — shadcn kurulmaz; Payload'ın mevcut component'leri CSS ile bu görünüme getirilir. Bir component'i stillemeden önce shadcn'deki karşılığının (Input, Select, Checkbox/Switch, Calendar, Dialog, Table) görsel anatomisi referans alınır.
Tüm CSS `@layer payload` içinde yazılır (Payload default'ları `@layer payload-default`'ta olduğu için specificity savaşı olmadan garantili override). Modüler SCSS: `_nav.scss`, `_buttons.scss`, `_forms.scss`, `_table.scss`, `_cards.scss`, `_misc.scss` → tek `styles.css` output. Bu katmanda component swap YOK, sadece CSS:
- **Nav active pill**: aktif nav linki tam yuvarlatılmış (border-radius: 999px), accent bg, contrast text, dolgulu. Hover'da accent-subtle bg.
- **Checkbox → toggle**: `appearance: none` ile input'u track+thumb'lı switch'e çevir; `:checked`'te thumb kayar, bg accent olur. Form davranışına dokunulmaz.
- **Input'lar**: shadcn Input anatomisi — ince nötr border, sakin bg, focus'ta accent border + `--pt-accent-ring` box-shadow (ring offset'li), placeholder muted, disabled'da düşük opacity. Arama kutuları pill. Textarea, number, email hepsi aynı dili konuşur.
- **Select (react-select)**: shadcn Select referansı — trigger input'larla aynı yükseklik ve border dili, dropdown menüsü yumuşak radius + shadow'lu popover görünümü, focused option accent-subtle bg, seçili option'da accent check/vurgu, multi-value chip'ler pill.
- **Date picker**: shadcn Calendar referansı — popover takvim kartı (radius + shadow), gün hücreleri yuvarlak hover'lı, seçili gün accent bg + contrast text ile tam daire, bugün ince accent ring'le işaretli, ay navigasyon butonları icon-button dilinde.
- **Kartlar**: `border-top: 3px solid var(--pt-accent)` accent şeridi + yumuşak radius + hafif shadow.
- **Table/list view**: seçili satır accent-subtle highlight, sort edilen kolon vurgusu, pagination aktif sayfa accent, "selected X items" bar'ı.
- **Butonlar**: primary (accent bg + contrast text + hover/active adımları), secondary (accent border/text, hover'da subtle bg), icon button'lar, pill'ler.
- Ayrıca: tab aktif underline, radio checked, link renkleri, breadcrumb aktif öğe, drawer/modal primary aksiyonları (dialog'lar shadcn Dialog dilinde: radius, shadow, overlay yumuşaklığı), progress/loading bar, version badge'leri.
- Selector'ler olabildiğince sığ ve `--theme-*` variable öncelikli yazılır (Payload minor update'lerinde kırılganlığı azaltmak için). BEM class hedefleme son çare.

**Katman 3: Replacement Layer (React component swap)**
Payload'ın `admin.components` API'si ve import map sistemi üzerinden:
- **Nav**: custom sidebar, dikey yapısı yukarıdan aşağıya şöyle:
  1. **Logo alanı (en üstte)**: sidebar'ın en tepesinde, ortalanmış, bol padding'li logo bloğu. Logo `payloadTheme({ logo: ... })` option'ından gelir (URL veya component path). Logo verilmezse Payload default'una ya da site adına (text fallback) düşer. Logo tıklanınca dashboard'a gider. Payload'ın logoyu header'da gösteren default davranışı yerine logo bu alana taşınır.
  2. **Nav linkleri**: her link solda ikon + sağda label. İkonlar plugin option'ından gelir (`nav.icons`, lucide-react). Aktif link tam yuvarlatılmış pill (accent bg + contrast text, ikon dahil), pasif linkler nötr renkte ikon+text, hover'da accent-subtle bg. Collection grupları desteklenir.
  3. Linkler arası dikey boşluk ferah tutulur (referans: Filament panel görseli — sıkışık default Payload nav'ı değil).
- **Icon** (favicon/küçük logo): plugin option'ı ile ayrıca verilebilir; collapsed nav ve login ekranında kullanılır.
- **Dashboard**: widget slot sistemi — hoş geldin başlığı, collection kartları, opsiyonel custom widget register API'si. (Bu en son yapılacak, en kompleks parça.)
- Field-level swap (select, date-picker gibi kompleks field'ların komple değişimi) şimdilik SCOPE DIŞI — CSS'in fiziksel olarak yetmediği kanıtlanırsa konuşuruz. Gerekirse pattern: plugin, config'deki tüm collection'ları recursive gezip ilgili field tipine `admin.components.Field` inject eder; custom component `@payloadcms/ui`'ın `useField` hook'unu kullanır.
- Component export'ları Payload 3 import map kurallarına uygun string path formatında: `'payload-theme/client#X'` / `'/rsc#Y'`. `payload generate:importmap` sonrası sorunsuz resolve olmalı.

## Paket Yapısı

- Plugin pattern: `payloadTheme(options) => (config) => config`
- Options validation elle yazılmış type guard'larla (zod yok); geçersiz input'ta anlaşılır hata: "Invalid accent color: 'mor'. Expected hex like #7c3aed"
- package.json exports: `.` (plugin), `./client`, `./rsc`, `./styles.css`. Peer deps: `payload`, `react`, `react-dom`, `@payloadcms/ui`. Build: tsup, ESM+CJS, CSS ayrı emit. TypeScript strict, public API JSDoc'lu.
- Escape hatch: `cssVariables: Record<string, string>` opsiyonu ile kullanıcı ham token override edebilir.
- Repo yapısı: pnpm workspace — `packages/payload-theme` (plugin) + `dev` (playground). Payload'ın resmi plugin template'i referans alınabilir.

## Çalışma Şekli — ÖNEMLİ

Bu projede **adım adım, benim onayımla** ilerliyoruz. Her fazın sonunda dur, ne yaptığını özetle, görsel kontrol için hangi ekranlara bakmam gerektiğini söyle ve benden onay bekle. Faz atlamak, "hazır başlamışken şunu da yapayım" YOK. Her önemli mimari kararda (renk uzayı, inject stratejisi, selector derinliği) 1-2 cümle gerekçe yaz.

**Mevcut durum:** Playground kurulumu TAMAMLANDI — Payload projesi ayakta, çalışır durumda. İlk işin: mevcut proje yapısını incele (config, collection'lar, custom.scss durumu, sürümler), kısa bir durum özeti çıkar ve Faz 1'e geç. Eğer incelemede tema geliştirmeyi zorlaştıracak bir eksik görürsen (örn. field tipi çeşitliliği az, versions kapalı, custom.scss bağlı değil) önce bunu bana raporla, onayımla tamamla.

**Git disiplini:** Her fazın sonunda (Faz 3'te her modülün sonunda) benim onayım ALINDIKTAN sonra anlamlı bir mesajla commit at. Onay gelmeden commit yok. Büyük değişikliklerden önce mevcut durumun commit'li olduğundan emin ol — geri dönüş noktalarımız bunlar.

**Faz 1 — Renk motoru (buradan başla):** Saf fonksiyonlar olarak hex→OKLCH→skala üretimi, kontrast seçimi, dark mapping. Unit testli (sarı→siyah text, mor→beyaz text, geçersiz input case'leri dahil).

**Faz 2 — Token + preset CSS'i:** custom.scss üzerinden (henüz paket değil) token mapping'i ve `soft` preset'ini oturt. Login + dashboard + list + edit view'da görsel kontrol.

**Faz 3 — Restyle layer:** Modül modül (nav pill → buttons → forms/toggle → table → misc). Her modülden sonra dur, bana hangi ekranda neyi kontrol edeceğimi söyle.

**Faz 4 — Plugin'e extract:** custom.scss'teki her şeyi `packages/payload-theme`'e taşı, plugin fonksiyonu + provider + style inject + options API. Playground artık paketi tüketir hale gelir.

**Faz 5 — Replacement layer:** Nav swap — Katman 3'te tarif edilen yapıda: en üstte logo alanı, altında ikonlu linkler, pill active state. Logo option'ı, ikon sistemi ve grup desteği bu fazda. En son Dashboard.

**Faz 6 — Preset'lerin tamamlanması + polish:** noir ve minimal preset'leri, README (kurulumun 2 satır olduğu ilk ekranda görünsün), ekran görüntüleri, npm publish hazırlığı.

## Kalite Kriterleri

- Fresh `create-payload-app` projesine kurulum maksimum 2 satır.
- Kontrol checklist'i (her fazda ilgili olanlar): login, dashboard, collection list (filtre/sort/pagination/bulk select), edit view (tüm field tipleri), drawer'lar, version view, account, global edit — hem light hem dark, hem de her preset'te.
- Payload'ın davranışı asla bozulmaz: form state, validation, erişilebilirlik (focus görünürlüğü, kontrast) korunur.
- Türkçe konuşuyoruz; kod, commit ve dokümantasyon İngilizce.