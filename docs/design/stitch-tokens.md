# Stitch Design Tokens (tahfizh-app-darul-ilmi)

## 1. Palet Warna (Hex)
- **Primary**: `#059669` (Zamrud)
- **Secondary (Accent)**: `#F59E0B` (Amber)
- **Tertiary**: `#3B82F6` (Biru)
- **Neutral (Text)**: `#0F172A` (Slate 900), `#1E293B`
- **Muted Text**: `#64748B` (Slate 500)
- **Canvas Base**: `#F0FDF4` (Soft tinted emerald)
- **Surface (Cards/Panels)**: `#FFFFFF`
- **Border**: `#E2E8F0`

### Warna Fungsional Tahfizh
- **Sabaq (Baru)**: Teks/Aksen `#10B981`, Background `#ECFDF5`, Border `#A7F3D0`
- **Sabqi (Dekat)**: Teks/Aksen `#3B82F6`, Background `#EFF6FF`, Border `#BFDBFE`
- **Manzil (Lama)**: Teks/Aksen `#F59E0B`, Background `#FFFBEB`, Border `#FDE68A`

## 2. Tipografi
- **Family**: Plus Jakarta Sans (Utama, untuk label, headline, dan body)
- **Numerals**: Menggunakan *tabular figures* untuk angka (juz, baris, dll) agar sejajar di tabel.
- **Weights**: 400 (Body), 600 (Labels), 700/800 (Headlines)

## 3. Radius (Shapes)
- **Cards & Data Modules**: 16px (`1rem` / `rounded-2xl`)
- **Inputs & Action Buttons**: 12px (`0.75rem` / `rounded-xl`)
- **Tahfizh Status Badges & Method Chips**: Penuh (`9999px` / `rounded-full`)
- **Icon Enclosures**: 10px (`0.625rem` / `rounded-lg`)

## 4. Bayangan (Elevation & Depth)
- **Level 1 (Default Cards/Panels)**: `box-shadow: 0 4px 16px -2px rgba(5, 150, 105, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)`
- **Level 2 (Hover/Active Modals)**: `box-shadow: 0 12px 24px -4px rgba(5, 150, 105, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)`
- **Spiritual Glow (Milestones/Mutqin)**: `box-shadow: 0 8px 24px -2px rgba(245, 158, 11, 0.18)`

## 5. Pola Layout
- **Grid Utama**: Berbasis kelipatan 8pt.
- **Desktop**: 12 Kolom (Maksimal `1280px` rata tengah), `1.25rem` (20px) gutters, margin luar `2rem` (32px).
- **Tablet**: 8 Kolom, `1rem` (16px) gutters, sidebar tersembunyi menjadi *slide-over drawer*.
- **Mobile**: 4 Kolom, margin `1rem` (16px).
- **Sidebar**: Di kiri, menetap (pinned) untuk navigasi Desktop.
- **Tabel**: Baris zebra berselang-seling (Zebra-striping) antara `#FFFFFF` dan `#F8FAFC`. Terdapat badge warna untuk metode.
- **Kartu**: Background `#FFFFFF` di atas kanvas `#F0FDF4`. Memiliki border tipis `#E2E8F0`.
