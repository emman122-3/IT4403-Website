# Individual Project Milestone 4 — Improved SPA UI

Emmanuel Osime · IT 4403

Milestone 4 extends the Milestone 3 Open Library SPA in a separate folder. Search and the Science Fiction collection use a shared Mustache book template. The selected Work record has its own template. Grid and list layouts use CSS and preserve the current results and page. Book data comes from Open Library through jQuery AJAX.

## Run locally

From the repository root, start a static server:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/milestone4/. Internet access is required for book data and covers. jQuery and Mustache are bundled locally. No build step is needed.

