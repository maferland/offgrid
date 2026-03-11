# Offgrid

Tauri 2.x desktop app — React/TypeScript frontend + Rust backend.

## Build

```bash
bun install
bun run tauri dev     # dev mode with HMR
bun run tauri build   # release build (.app + .dmg)
```

## Rust

```bash
cd src-tauri
cargo check           # type check
cargo clippy          # lint
cargo test            # tests
```

## Frontend

```bash
bun run dev           # vite dev server only (no Tauri)
bun run build         # production build
```

## Environment Variables

- `INSTAGRAM_APP_ID` — Meta Developer App ID
- `INSTAGRAM_APP_SECRET` — Meta Developer App Secret

## Structure

- `src/` — React frontend (pages, components, lib)
- `src-tauri/src/` — Rust backend (commands, db, instagram API client)
- `src-tauri/src/instagram/` — auth, media upload, mentions polling
