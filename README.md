# Individual Project Milestone 4 — Improved SPA UI

Emmanuel Osime · IT 4403

Milestone 4 extends the Milestone 3 Open Library SPA in a separate folder. Search and the Science Fiction collection use a shared Mustache book template. The selected Work record has its own template. Grid and list layouts use CSS and preserve the current results and page. Book data comes from Open Library through jQuery AJAX.

## Run locally

From the repository root, start a static server:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/milestone4/. Internet access is required for book data and covers. jQuery and Mustache are bundled locally. No build step is needed.

## Publish on Azure

Add the `milestone4/` directory to the [course repository](https://github.com/emman122-3/IT4403-Website). For an Azure Static Web App dedicated to this milestone, select the GitHub repository and branch, use the **Custom** or **No Framework** preset, and set the app location to `/milestone4`. Leave the API and output locations empty. If configuring the generated workflow to skip the build, set `skip_app_build: true`. After the deployment succeeds, the Azure Static Web Apps hostname opens Milestone 4 at its root. If deploying the entire course repository to an existing Azure site, keep the app location at `/` and use the `/milestone4/` path.

- [Azure Static Web Apps build configuration](https://learn.microsoft.com/azure/static-web-apps/build-configuration)
- [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
- [Open Library Subjects API](https://openlibrary.org/dev/docs/api/subjects)
- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers)
