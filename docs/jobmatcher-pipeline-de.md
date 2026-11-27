# Execution Plan & Data Engineering Spec: Job Matcher Interactive Analytics Pipeline

**Location:** `docs/jobmatcher-pipeline-de.md`  
**Status:** Planned / Architecture Blueprint (Sidecar Zero-Backend + One Big Table Pattern)  
**Budget / Cost Model:** 100% Free Tier ($0) — Cloudflare Pipelines + Cloudflare R2 + MotherDuck Free Lite + Preset / Superset (Manual Setup, Zero Terraform)

---

## 1. Executive Summary & Non-Invasive Sidecar Architecture

Dokumen ini mendefinisikan rencana eksekusi Data Engineering untuk mengalirkan data analitik non-PII dari interaktif Job Matcher ke **Public-Facing Dashboard (Preset / Superset)** dengan arsitektur **Zero-Backend ($0)**.

### Prinsip Utama & Keputusan Arsitektur
1. **Sama Sekali Tidak Menyentuh Core Engine & Corpus:**
   - File `src/data/icd-matching.json` (pertanyaan, bobot kriteria, opsi, relasi jurusan) **tidak diubah/disentuh sedikitpun**.
   - Logika scoring (`src/lib/matching/scorer.ts`, `candidate.ts`, `client.ts`), quiz state, dan `sessionStorage` di `MatchingModal.tsx` tetap utuh.
2. **Reuse Existing Analytics Stub (`src/lib/analytics.ts`) Tanpa Build dari Nol:**
   - Memanfaatkan infrastruktur telemetry yang sudah ada di repo: offline queue `localStorage`, fallback `navigator.sendBeacon` + `fetch(..., { keepalive: true })`, serta lifecycle flush (`pagehide`, `visibilitychange`).
   - Sidecar hanya menambahkan tipe event `'matching.completed'` dan fungsi helper pembuat payload canonical.
3. **One Big Table (OBT) di MotherDuck (No Star-Schema Joins):**
   - MotherDuck berbasis DuckDB yang merupakan **columnar vectorized engine**. Pada columnar OLAP dan kuota hemat compute (10 jam free tier), pola **One Big Table (OBT) denormalized** jauh lebih optimal, cepat, dan hemat compute dibandingkan Star Schema yang membutuhkan runtime join antar tabel fakta & dimensi.
   - 1 Single View `mart_jobfair` bertindak sebagai *Single Source of Truth*, DQ gate, deduplikator, dan tabel analitik siap query.
4. **Strict Non-PII & Privacy-by-Design:**
   - Zero-PII: Dilarang keras mengirim nama, email, nomor HP, IP mentah, atau info identitas.
   - Identitas anonim: Menggunakan `player_id` random UUID dan deterministik key `event_id` (`${session_id}_${answerFingerprint}`) via synchronous FNV-1a.
5. **No Terraform / Manual Cloud Setup:**
   - Konfigurasi Cloudflare Pipelines, R2, MotherDuck, dan Preset dilakukan secara manual melalui Web UI masing-masing provider tanpa boilerplate IaC/Terraform.

---

## 2. End-to-End Architecture & Dataflow

```text
[Job Matcher Modal (Frontend Astro/React Client)]
   │  1. User menyelesaikan kuis; hasil dihitung in-memory oleh engine yang sudah ada.
   │  2. Sidecar Hook (`dispatchJobMatcherAnalytics`) mengekstrak data jawaban non-PII.
   │  3. Cap Guard: Cek localStorage `jf_play_count <= 40` (Bypass jika ?mode=booth).
   │  4. Deterministic Key: Synchronous 32-bit FNV-1a hash membuat `event_id = ${sessionId}_${answerFingerprint}`.
   │  5. Reuse `src/lib/analytics.ts` -> 1x HTTP POST via sendBeacon / fetch keepalive.
   ▼
[Cloudflare Basin / Stream Pipelines]
   │  1. HTTP Stream Endpoint (Auth: Disabled; CORS: Restrict ke domain ICD).
   │  2. Strict JSON Schema Validation (drops unknown properties & malformed data at edge).
   │  3. Micro-Batching otomatis: Menulis file `.parquet` terkompresi ke R2 sink tiap 10-60 detik.
   ▼
[Cloudflare R2 Bucket (Raw Landing Sink)]
   │  1. Menyimpan immutable raw parquet files under `jobfair/raw/`.
   │  2. Free tier: 10 GB storage & 1M Class A write ops/bulan (micro-batching menjamin writes sangat minim).
   ▼
[MotherDuck (Zero-Copy Compute + One Big Table DQ Gate)]
   │  1. Baca Parquet dari R2 secara zero-copy (`read_parquet('r2://...')`) via `CREATE SECRET`.
   │  2. 1 Single View `mart_jobfair` (OBT):
   │     - Deduplikasi `event_id` (ROW_NUMBER)
   │     - Enforce batas maksimal 40x play per player non-booth (DENSE_RANK)
   │     - Data cleansing (COALESCE string kosong -> 'Unknown')
   ▼
[Preset / Apache Superset (Public Dashboard)]
   └─ Direct SQL ke `mart_jobfair` dengan Cache TTL 30–60 detik (mencegah lonjakan compute MotherDuck).
```

---

## 3. Implementation Plan: Frontend Repo (This Repository)

File dan folder di repo ini yang perlu ditambahkan / diubah secara non-invasif:

### Summary of Changes

| Target File | Status | Peran & Deskripsi |
|---|---|---|
| `src/lib/analytics.ts` | **Edit** (Non-invasive) | Tambahkan tipe `'matching.completed'` ke `AnalyticsEventType`. Helper transport & queue tetap dipakai langsung. |
| `src/lib/analytics/jobMatcherSidecar.ts` | **Create New** | Modul sidecar: FNV-1a hashing, play count enforcement (40x cap), deteksi `?mode=booth`, serialisasi non-PII canonical payload. |
| `src/islands/matching/MatchingModal.tsx` | **Edit** (1-line tap) | Panggil helper sidecar `trackMatchingCompletion` saat status matching berpindah ke `results`. Tidak mengubah alur UI/state modal. |
| `docs/jobmatcher-pipeline-de.md` | **Documentation** | Master specification & reference (dokumen ini). |

---

### Step-by-Step Frontend Implementation

#### Step 1: Update `src/lib/analytics.ts`
Tambahkan `'matching.completed'` ke union type `AnalyticsEventType`:
```typescript
export type AnalyticsEventType =
  | 'bookmark.add'
  | 'bookmark.remove'
  | 'bookmark.view'
  | 'booth.select'
  | 'walkin.room.select'
  | 'search.query'
  | 'sidebar.tab.switch'
  | 'area.switch'
  | 'day.switch'
  | 'share.send'
  | 'item.click'
  | 'facility.click'
  | 'cta.click'
  | 'gik.mode'
  | 'page.view'
  | 'matching.completed'; // <-- Tambahan untuk telemetry Job Matcher
```

#### Step 2: Create `src/lib/analytics/jobMatcherSidecar.ts`
Implementasikan sidecar yang bertugas menyusun OBT payload, menghitung FNV-1a synchronous hash, dan memeriksa play cap:

```typescript
import { track } from '../analytics';
import type { Answers, Candidate, Result } from '../matching/types';

const PLAYER_ID_KEY = 'jf_player_id';
const PLAY_COUNT_KEY = 'jf_play_count';
const MAX_PLAYS = 40;

/**
 * Synchronous 32-bit FNV-1a Hash (Hex 8 chars)
 * Aman & zero-lag pada mobile browser low-end tanpa crypto.subtle async.
 */
export function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function isBoothMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('mode') === 'booth';
}

export function getAnonymousPlayerId(isBooth: boolean): string {
  if (isBooth || typeof window === 'undefined') {
    return crypto.randomUUID();
  }
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function canPlayAndIncrement(isBooth: boolean): boolean {
  if (isBooth || typeof window === 'undefined') return true;
  const current = parseInt(localStorage.getItem(PLAY_COUNT_KEY) || '0', 10);
  if (current >= MAX_PLAYS) return false;
  localStorage.setItem(PLAY_COUNT_KEY, String(current + 1));
  return true;
}

/**
 * Canonical Non-PII OBT Payload
 */
export interface JobMatcherOBTPayload {
  event_id: string;
  player_id: string;
  session_id: string;
  is_booth: boolean;
  role_track: string;
  experience_tier: string;
  education_level: string;
  major_group: string;
  target_program: string;
  region: string;
  campus_origin: string;
  gpa_tier: number | null;
  score: number;
  top_booth_id: string;
  top_role_title: string;
  interest_tech: number;
  interest_data: number;
  interest_biz: number;
  interest_ops: number;
  interest_people: number;
  interest_create: number;
  duration_ms: number;
  grad_year: number | null;
  client_ts: string;
}

/**
 * Menghasilkan hash deterministik dari jawaban kuis untuk deduplikasi di warehouse.
 */
export function buildAnswerFingerprint(answers: Answers): string {
  const sortedKeys = Object.keys(answers).sort();
  const canonicalString = sortedKeys.map((k) => `${k}:${answers[k]}`).join('|');
  return fnv1a(canonicalString);
}

/**
 * Sidecar tap: Dipanggil saat quiz selesai tanpa mempengaruhi state React.
 */
export function trackMatchingCompletion(params: {
  sessionId: string;
  answers: Answers;
  candidate: Candidate;
  result: Result;
  durationMs: number;
}) {
  const isBooth = isBoothMode();
  if (!canPlayAndIncrement(isBooth)) {
    // Melebihi 40x play cap di browser normal
    return;
  }

  const playerId = getAnonymousPlayerId(isBooth);
  const fingerprint = buildAnswerFingerprint(params.answers);
  const eventId = `${params.sessionId}_${fingerprint}`;

  // Cari top interest axis
  const interestEntries = Object.entries(params.candidate.interest) as [string, number][];
  interestEntries.sort((a, b) => b[1] - a[1]);
  const primaryTrack = interestEntries[0]?.[0] || 'Unknown';

  const bestMatch = params.result.matches[0];

  const payload: JobMatcherOBTPayload = {
    event_id: eventId,
    player_id: playerId,
    session_id: params.sessionId,
    is_booth: isBooth,
    role_track: primaryTrack,
    experience_tier: String(params.candidate.stage ?? 'unknown'),
    education_level: String(params.candidate.level ?? 'unknown'),
    major_group: params.candidate.major || 'other',
    target_program: params.candidate.want || 'any',
    region: params.candidate.region || 'all',
    campus_origin: params.candidate.campus === 2 ? 'UGM' : 'Other',
    gpa_tier: params.candidate.gpa ?? null,
    score: bestMatch ? Math.round(bestMatch.confidence) : 0,
    top_booth_id: bestMatch ? bestMatch.role.b : 'none',
    top_role_title: bestMatch ? bestMatch.role.r : 'none',
    interest_tech: params.candidate.interest.tech ?? 0,
    interest_data: params.candidate.interest.data ?? 0,
    interest_biz: params.candidate.interest.biz ?? 0,
    interest_ops: params.candidate.interest.ops ?? 0,
    interest_people: params.candidate.interest.people ?? 0,
    interest_create: params.candidate.interest.create ?? 0,
    duration_ms: Math.max(0, Math.round(params.durationMs)),
    grad_year: null, // Nullable untuk backward/forward compatibility
    client_ts: new Date().toISOString(),
  };

  // Dispatch via existing telemetry utility
  track('matching.completed', payload as unknown as Record<string, unknown>);
}
```

#### Step 3: Non-Invasive Tap di `src/islands/matching/MatchingModal.tsx`
Saat `runMatching` selesai menghitung hasil di `MatchingModal.tsx`, panggil `trackMatchingCompletion` 1 kali. Tidak ada perubahan pada UI, animasi modal, atau logic rekomendasi.

---

## 4. Implementation Plan: Pipeline & Cloud Infrastructure (Manual Setup)

Bagian ini disiapkan untuk repo pipeline analitik terpisah (atau direct cloud configuration). Tidak membutuhkan Terraform.

### 4.1 Cloudflare Pipelines & R2 Setup Checklist (Web UI)
1. **Buat R2 Bucket:**
   - Masuk ke Cloudflare Dashboard -> **R2 Object Storage** -> **Create Bucket**.
   - Nama bucket: `icd2026-analytics-raw`.
   - Lokasi: Otomatis / WNAM / APAC.
2. **Buat R2 API Tokens:**
   - Buka **R2** -> **Manage R2 API Tokens** -> **Create API Token**.
   - Permissions: **Object Read & Write** (untuk Pipeline) dan **Object Read-Only** (untuk MotherDuck Secret).
   - Simpan `Access Key ID`, `Secret Access Key`, dan `Account ID`.
3. **Konfigurasi Cloudflare Basin / Stream Pipelines:**
   - Buat pipeline baru dengan Source: **HTTP Endpoint**.
   - **Authentication:** `Disabled` (browser publik dapat mengirim tanpa token rahasia).
   - **CORS:** Atur `Allowed Origins` hanya ke domain resmi event (misal `https://icd2026.id`, `http://localhost:4321` untuk dev).
   - **Sink:** Pilih Cloudflare R2 bucket `icd2026-analytics-raw`.
   - **Output Format:** **Parquet** (Snappy compressed, Micro-batch window: 30 detik atau 5 MB).
   - **Input Schema:** Paste **Strict JSON Schema** di bawah ini.

#### Cloudflare Pipeline Strict JSON Schema Contract
*Menolak properti liar, payload malformed, atau injection.*
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "JobMatcherOBTPayload",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "event_id",
    "player_id",
    "session_id",
    "is_booth",
    "role_track",
    "experience_tier",
    "education_level",
    "major_group",
    "target_program",
    "region",
    "campus_origin",
    "score",
    "top_booth_id",
    "top_role_title",
    "duration_ms",
    "client_ts"
  ],
  "properties": {
    "event_id": { "type": "string", "maxLength": 80 },
    "player_id": { "type": "string", "maxLength": 64 },
    "session_id": { "type": "string", "maxLength": 64 },
    "is_booth": { "type": "boolean" },
    "role_track": { "type": "string", "maxLength": 32 },
    "experience_tier": { "type": "string", "maxLength": 32 },
    "education_level": { "type": "string", "maxLength": 32 },
    "major_group": { "type": "string", "maxLength": 32 },
    "target_program": { "type": "string", "maxLength": 32 },
    "region": { "type": "string", "maxLength": 32 },
    "campus_origin": { "type": "string", "maxLength": 16 },
    "gpa_tier": { "type": ["integer", "null"], "minimum": 1, "maximum": 5 },
    "score": { "type": "number", "minimum": 0, "maximum": 100 },
    "top_booth_id": { "type": "string", "maxLength": 32 },
    "top_role_title": { "type": "string", "maxLength": 64 },
    "interest_tech": { "type": "integer", "minimum": 0, "maximum": 10 },
    "interest_data": { "type": "integer", "minimum": 0, "maximum": 10 },
    "interest_biz": { "type": "integer", "minimum": 0, "maximum": 10 },
    "interest_ops": { "type": "integer", "minimum": 0, "maximum": 10 },
    "interest_people": { "type": "integer", "minimum": 0, "maximum": 10 },
    "interest_create": { "type": "integer", "minimum": 0, "maximum": 10 },
    "duration_ms": { "type": "integer", "minimum": 0, "maximum": 86400000 },
    "grad_year": { "type": ["integer", "null"], "minimum": 2010, "maximum": 2035 },
    "client_ts": { "type": "string", "format": "date-time" }
  }
}
```

---

### 4.2 MotherDuck Setup (Zero-Copy OBT Data Mart & DQ Gate)

Jalankan query DDL berikut di MotherDuck SQL Web Console:

```sql
-- 1. Setup R2 Secret (Eksekusi 1x)
CREATE SECRET IF NOT EXISTS r2_icd_lake (
    TYPE R2,
    KEY_ID '<R2_ACCESS_KEY_ID>',
    SECRET '<R2_SECRET_ACCESS_KEY>',
    ACCOUNT_ID '<CF_ACCOUNT_ID>'
);

-- 2. One Big Table (OBT) Single-View Data Mart dengan Anti-Spam / Anti-Troll Gate
CREATE OR REPLACE VIEW mart_jobfair AS
WITH raw_events AS (
    SELECT
        TRIM(event_id) AS event_id,
        TRIM(player_id) AS player_id,
        TRIM(session_id) AS session_id,
        COALESCE(is_booth, FALSE) AS is_booth,
        COALESCE(NULLIF(TRIM(role_track), ''), 'Unknown') AS role_track,
        COALESCE(NULLIF(TRIM(experience_tier), ''), 'Unknown') AS experience_tier,
        COALESCE(NULLIF(TRIM(education_level), ''), 'Unknown') AS education_level,
        COALESCE(NULLIF(TRIM(major_group), ''), 'Unknown') AS major_group,
        COALESCE(NULLIF(TRIM(target_program), ''), 'Unknown') AS target_program,
        COALESCE(NULLIF(TRIM(region), ''), 'Unknown') AS region,
        COALESCE(NULLIF(TRIM(campus_origin), ''), 'Unknown') AS campus_origin,
        gpa_tier,
        score,
        COALESCE(NULLIF(TRIM(top_booth_id), ''), 'None') AS top_booth_id,
        COALESCE(NULLIF(TRIM(top_role_title), ''), 'None') AS top_role_title,
        COALESCE(interest_tech, 0) AS interest_tech,
        COALESCE(interest_data, 0) AS interest_data,
        COALESCE(interest_biz, 0) AS interest_biz,
        COALESCE(interest_ops, 0) AS interest_ops,
        COALESCE(interest_people, 0) AS interest_people,
        COALESCE(interest_create, 0) AS interest_create,
        duration_ms,
        grad_year,
        TRY_CAST(client_ts AS TIMESTAMPTZ) AS client_ts,
        COALESCE(TRY_CAST(_ingested_at AS TIMESTAMPTZ), TRY_CAST(client_ts AS TIMESTAMPTZ), now()) AS ingested_at
    FROM read_parquet('r2://icd2026-analytics-raw/**/*.parquet')
    WHERE event_id IS NOT NULL 
      AND TRIM(event_id) != ''
      AND score >= 0 
      AND score <= 100
      AND duration_ms >= 0
),
dq_windowed AS (
    SELECT *,
        -- DQ 1: Deduplikasi event_id yang dikirim ganda
        ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingested_at ASC) AS event_dedupe_idx,
        -- DQ 2: Rank sesi main user (cap 40 per non-booth player)
        DENSE_RANK() OVER (PARTITION BY player_id ORDER BY ingested_at ASC) AS play_rank,
        -- DQ 3: Total submit yang dilakukan oleh player_id ini dalam dataset
        COUNT(*) OVER (PARTITION BY player_id) AS total_player_submits,
        -- DQ 4: Jarak waktu antar submit berturut-turut oleh player yang sama (dalam detik)
        COALESCE(DATE_DIFF('second', LAG(ingested_at) OVER (PARTITION BY player_id ORDER BY ingested_at ASC), ingested_at), 9999) AS sec_since_prev_submit
    FROM raw_events
),
flagged_events AS (
    SELECT *,
        -- Deteksi Sinyal Bot / Troll Spam:
        -- 1. Kecepatan pengerjaan kuis tidak manusiawi (< 3 detik untuk belasan pertanyaan)
        -- 2. Spam burst: Submit ulang dalam selang waktu < 2 detik oleh player yang sama
        -- 3. Volume anomali: Player non-booth yang mencoba submit > 40 kali di raw lake
        CASE 
            WHEN duration_ms < 3000 THEN TRUE
            WHEN sec_since_prev_submit < 2 THEN TRUE
            WHEN is_booth = FALSE AND total_player_submits > 45 THEN TRUE
            ELSE FALSE
        END AS is_suspicious_spam
    FROM dq_windowed
)
SELECT
    event_id,
    player_id,
    session_id,
    is_booth,
    role_track,
    experience_tier,
    education_level,
    major_group,
    target_program,
    region,
    campus_origin,
    gpa_tier,
    score,
    top_booth_id,
    top_role_title,
    interest_tech,
    interest_data,
    interest_biz,
    interest_ops,
    interest_people,
    interest_create,
    duration_ms,
    grad_year,
    client_ts,
    ingested_at,
    is_suspicious_spam
FROM flagged_events
WHERE event_dedupe_idx = 1
  AND (is_booth = TRUE OR play_rank <= 40);
```

---

## 5. Column Schema (OBT Data Dictionary) & Visualizations

### 5.1 One Big Table (OBT) Columns Dictionary

Hasil dari proses Ingest -> Cleanse -> DQ Gate di view `mart_jobfair`:

| Nama Kolom | Tipe Data | Deskripsi Kolom |
|---|---|---|
| `event_id` | `VARCHAR` | Unique event identifier (`${sessionId}_${fnv1a(answers)}`) |
| `player_id` | `VARCHAR` | Anonymous persistent ID per browser (UUID baru per submit jika booth) |
| `session_id` | `VARCHAR` | UUID sesi modal game dibuka |
| `is_booth` | `BOOLEAN` | True jika diakses dari perangkat booth (`?mode=booth`) |
| `role_track` | `VARCHAR` | Track dominan hasil kuis (`tech`, `data`, `biz`, `ops`, `people`, `create`) |
| `experience_tier` | `VARCHAR` | Status pengalaman (`student`, `fresh`, `exp2`, `exp3`) |
| `education_level` | `VARCHAR` | Jenjang pendidikan (`d3`, `d4`, `s1`, `s2`) |
| `major_group` | `VARCHAR` | Rumpun jurusan (`cs`, `data`, `biz`, `indus`, `mech`, dll.) |
| `target_program` | `VARCHAR` | Target karier (`intern`, `trainee`, `staff`, `fellow`, `any`) |
| `region` | `VARCHAR` | Wilayah domisili (`diy`, `jabodetabek`, `jatim`, `lainnya`) |
| `campus_origin` | `VARCHAR` | Asal kampus (`UGM` vs `Other`) |
| `gpa_tier` | `INTEGER` | Tier IPK (1: <2.75 s.d 5: >=3.50, NULL jika di-skip) |
| `score` | `DOUBLE` | Match confidence score (0-100) |
| `top_booth_id` | `VARCHAR` | ID booth perusahaan dengan skor rekomendasi tertinggi |
| `top_role_title` | `VARCHAR` | Nama posisi karier paling relevan |
| `interest_tech` | `INTEGER` | Skor radar minat Teknologi (0-5) |
| `interest_data` | `INTEGER` | Skor radar minat Analisis Data (0-5) |
| `interest_biz` | `INTEGER` | Skor radar minat Bisnis & Sales (0-5) |
| `interest_ops` | `INTEGER` | Skor radar minat Operasional (0-5) |
| `interest_people` | `INTEGER` | Skor radar minat HR & Komunikasi (0-5) |
| `interest_create` | `INTEGER` | Skor radar minat Desain & Konten (0-5) |
| `duration_ms` | `BIGINT` | Durasi pengerjaan kuis dalam milidetik |
| `grad_year` | `INTEGER` | Tahun kelulusan (NULLable) |
| `client_ts` | `TIMESTAMPTZ` | Timestamp ISO pembuatan data di klien |
| `ingested_at` | `TIMESTAMPTZ` | Timestamp data mendarat di lake |
| `is_suspicious_spam` | `BOOLEAN` | True jika terindikasi spam/troll (duration < 3s, burst < 2s, atau volume anomali) |

---

### 5.2 Preset / Apache Superset Dashboard Charts
Karena data dimodelkan sebagai **One Big Table**, query di Superset sangat cepat dan tidak memakan CPU MotherDuck untuk join table.

> [!TIP]
> **Anti-Troll Filter di Preset / Superset:**
> Pada semua chart analitik utama di dashboard publik, pasang filter global dataset:  
> `WHERE is_suspicious_spam = FALSE`  
> Hal ini menjamin angka statistik demografi dan minat murni merefleksikan pengunjung manusia asli tanpa dirusak oleh troller/bot. Selain itu, kita bisa membuat 1 chart khusus monitoring traffic untuk panitia: *"Traffic Health: Normal vs Suspicious Submissions"*.

Berikut katalog visualisasi utama yang siap dibuat:

#### 1. Career Track & Talent Demand Distribution (Donut Chart)
- **Metrik:** `COUNT(event_id)`
- **Dimensi:** `role_track`
- **Tujuan:** Mengetahui minat terbanyak pengunjung (Teknologi vs Bisnis vs Data vs Operasional).

#### 2. Regional & Campus Origin Breakdown (Stacked Bar Chart)
- **Dimensi X:** `region`
- **Dimensi Sub-group:** `campus_origin` (UGM vs Kampus Lain)
- **Metrik:** `COUNT(event_id)`
- **Tujuan:** Mengetahui sebaran demografi domisili pengunjung acara.

#### 3. Match Quality & Score Distribution (Histogram / Boxplot)
- **Dimensi:** Binned `score` (misal 50-60, 60-70, 70-80, 80-90, 90-100)
- **Metrik:** `COUNT(event_id)`, `AVG(score)`, `MEDIAN(score)`
- **Tujuan:** Mengukur seberapa cocok profil kandidat dengan kualifikasi lowongan booth yang tersedia di acara.

#### 4. Top 10 Most Recommended Booths (Horizontal Bar Chart)
- **Dimensi:** `top_booth_id`
- **Metrik:** `COUNT(event_id)`
- **Tujuan:** Menampilkan booth mana yang paling banyak direkomendasikan algoritma untuk dieksplor peserta.

#### 5. Experience vs Target Program Heatmap (Heatmap Chart)
- **Sumbu X:** `target_program` (Magang, Trainee, Staf)
- **Sumbu Y:** `experience_tier` (Mahasiswa aktif, Fresh grad, Pengalaman)
- **Metrik:** `COUNT(event_id)`
- **Tujuan:** Memberi insight ke tim HR & sponsor mengenai preferensi program peserta berdasarkan jenjang karier.

#### 6. Kiosk Booth vs Personal Mobile Traffic (Metric KPI Cards)
- **Metrik 1:** Total Gameplay `COUNT(event_id)`
- **Metrik 2:** Booth Tablet Players `COUNT(CASE WHEN is_booth THEN 1 END)`
- **Metrik 3:** Avg Completion Time `ROUND(AVG(duration_ms)/1000, 1)` detik.

#### 7. Traffic Integrity & Bot/Troll Sentinel (Monitoring Donut Chart)
- **Dimensi:** `CASE WHEN is_suspicious_spam THEN 'Suspicious / Spam Bot' ELSE 'Verified Human Visitor' END`
- **Metrik:** `COUNT(event_id)`
- **Tujuan:** Visibilitas real-time bagi tim teknis & panitia untuk memantau seberapa banyak spam yang berhasil diisolasi dari statistik utama.

---

## 6. Public Dashboard Guardrail Checklist
- [x] **Strict Non-PII:** Dilarang mengikutsertakan field kontak pribadi peserta.
- [x] **Strict JSON Schema:** Diterapkan di edge Basin Pipeline untuk mencegah arbitrary injection.
- [x] **MotherDuck 10-Hour Compute Shield:** Set cache TTL di Preset / Superset pada rentang **30–60 detik**. Jangan matikan cache pada dashboard publik.
- [x] **ReadOnly User:** Kredensial MotherDuck yang dipasang di Superset menggunakan token Read-Only ke view `mart_jobfair`.
