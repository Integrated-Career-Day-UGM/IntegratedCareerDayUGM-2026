# Posters

Drop the three social-media posters here:

```
posters/source/
  career-expo.png
  walk-in-interview.png
  main-poster.png
```

Then run:

```bash
bun run compress:posters
```

The script writes optimized WebP files to `public/posters/`, which is what the
map's Info tab reads:

- `/posters/career-expo.webp`
- `/posters/walk-in-interview.webp`
- `/posters/main-poster.webp`

WebP is used instead of gzip: gzip only compresses the already-compressed file
bytes, while WebP actually reduces the image pixels.
