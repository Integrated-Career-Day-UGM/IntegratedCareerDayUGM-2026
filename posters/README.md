# Posters

Drop event posters here:

```
posters/source/
  career-expo.png
  walk-in-interview.png
  main-poster.png
```

Drop company posters in their own folder, named by company id or company name:

```
posters/source/company-posters/
  c2-monee.webp
  pt-astra-international-tbk.png
```

Then run:

```bash
bun run compress:posters
bun run sync:posters
```

The scripts write optimized WebP files to:

- `public/posters/*.webp` — event posters
- `public/posters/companies/*.webp` — company posters

`sync:posters` matches each file to a `companies.json` row by company id or a
slug of the company name, then writes `posterUrl` and `posterDownloadUrl`.
No match, no field: the detail card simply omits the poster button.

WebP is used instead of gzip: gzip only compresses the already-compressed file
bytes, while WebP actually reduces the image pixels.
