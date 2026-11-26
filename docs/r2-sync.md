# Uploading Posters to Cloudflare R2 via rclone

Full-size posters are served from a **public Cloudflare R2 bucket** so they don't bloat the
Vercel static deployment. Files are content-addressed with an 8-char MD5 hash so the CDN can
cache them forever (`Cache-Control: public, max-age=31536000, immutable`).

---

## 1. Prerequisites

### Install rclone
Download from https://rclone.org/downloads/ and add it to your PATH:

```powershell
# Windows (winget)
winget install Rclone.Rclone
# or download the zip from https://rclone.org/downloads/ and add rclone.exe to PATH
```

Verify:
```powershell
rclone version
```

### Configure rclone for Cloudflare R2

```powershell
rclone config
```

When prompted:
1. **New remote** → `n`
2. **Name**: `r2-icd`
3. **Storage type**: `s3` (option 5 or search "S3")
4. **Provider**: `Cloudflare` (option for Cloudflare R2)
5. **Access key ID**: *(your R2 Access Key ID from Cloudflare dashboard → R2 → Manage R2 API Tokens)*
6. **Secret access key**: *(your R2 Secret Access Key)*
7. **Endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   *(Account ID is in Cloudflare dashboard top-right)*
8. Leave everything else blank / default.

Test the connection:
```powershell
rclone ls r2-icd:icd-posters
```

---

## 2. Hash & Stage the ORIGINALS for R2

The originals (full-resolution JPG/PNG from the design team) are what users download.
The compressed WebP in `public/posters/` is display-only.

```powershell
cd "E:\grinding\Integrated Career Day\Integrated-Career-Day-2026"
$env:POSTER_SOURCE_DIR = "E:\grinding\Integrated Career Day\posters"
node scripts/prepare-r2-posters.mjs
```

This:
- Reads original JPG/PNG from `POSTER_SOURCE_DIR`
- Hashes each file (MD5, 8 chars) for cache-busting
- Stages renamed originals into `.tmp/r2-posters-orig/orig/<companyId>/`
- Writes `src/data/ugm-icd-2026/poster-r2-manifest.json`

> **Important**: `.tmp/` is gitignored. Only the manifest JSON is committed.

> You still run `import-company-posters.mjs` separately to generate the display WebPs
> for the in-page poster viewer — that's independent of the R2 download originals.

---

## 4. Upload to R2

```powershell
rclone copy .tmp\r2-posters-orig r2-icd:icd-posters `
  --progress `
  --transfers 10 `
  --s3-no-check-bucket `
  --header-upload "Cache-Control:public, max-age=31536000, immutable"
```

> No `Content-Type` override — originals are mixed JPG/PNG/PDF so rclone detects
> the correct MIME type per file automatically.

Flags explained:
- `--transfers 10` — 10 parallel uploads (tune down if you hit rate limits)
- `--s3-no-check-bucket` — skip the bucket existence check (you know it exists)
- `--header-upload` — sets the correct Cache-Control and MIME type on each object

After upload, objects are publicly accessible at:
```
https://posters.icdugm26.app/<r2Key>
# e.g. https://posters.icdugm26.app/companies/c2-monee/monee-slide-1-a1b2c3d4.webp
```

> If you haven't set up a custom domain yet, use your `r2.dev` subdomain URL and update
> `R2_PUBLIC_BASE_URL` in the script or the manifest `baseUrl` field.

---

## 4. Commit the Manifest

```powershell
git add src/data/ugm-icd-2026/poster-r2-manifest.json
git commit -m "chore: sync poster-r2-manifest (content-addressed R2 keys)"
```

The manifest is small, harmless public data, and hardcoding it means zero runtime
API calls — the browser download callback in `src/lib/posters/downloadPoster.ts`
reads it at build time and ships it as a static JS chunk.

---

## 5. Re-syncing After New Posters Are Added

1. Add new source images to `posters/source/company-posters/<company>/`
2. Run `node scripts/import-company-posters.mjs` (or `bun run compress:posters`) to compress them
3. Run `node scripts/prepare-r2-posters.mjs` to hash + stage
4. Run the rclone upload command above (rclone only uploads new/changed files)
5. Commit the updated manifest

---

## R2 Bucket CORS Configuration (for `<a download>` to work)

In Cloudflare dashboard → R2 → `icd-posters` → Settings → CORS:

```json
[
  {
    "AllowedOrigins": ["https://www.icdugm26.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

Without this, the download anchor falls back to opening the URL in a new tab
(which still triggers the browser download dialog — just less seamless).
