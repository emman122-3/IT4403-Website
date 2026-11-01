# Milestone 3 - Open Library Single Page Application

Emmanuel Osime | IT 4403 | W01 (85564) | Fall 2026

## Files

- `milestone3/index.html`: the single application UI.
- `milestone3/style.css`: independent Milestone 3 styling.
- `milestone3/js/app.js`: jQuery AJAX requests, rendering, local pagination, and states.
- `milestone3/vendor/jquery-3.7.1.min.js`: local jQuery distribution, with license header.
- Root `index.html` and `projects.html`: links to Milestone 3.

Milestone 2's eight files are byte-for-byte unchanged from the supplied project ZIP.
Only jQuery is used as an application library. There is no build step.

## Run

From this project folder run `python3 -m http.server 8000`, then open
`http://localhost:8000/milestone3/`. Internet access is required for live books
and covers. Search, pagination, and details all update the existing document.
Section navigation uses anchors; only the external Open Library link opens a tab.

## Publish source to GitHub

Repository: https://github.com/emman122-3/IT4403-Website

Before uploading, compare the ZIP's root homepage with the current repository if
it has changed since the earlier milestone. Add the new milestone3 folder and
merge the Milestone 3 links into index.html and projects.html. Do not replace or
delete the existing milestone2 folder. Keep the repository public through ten
days after the submission deadline.

## Publish with Azure Static Web Apps (portal, no VS Code)

1. Sign into https://portal.azure.com using an account with a subscription.
2. Create a Static Web App. Choose an appropriate resource group and the Free
   hosting plan if available for the account. Select GitHub as the deployment source.
3. Authorize the GitHub connection, select IT4403-Website and its submission branch.
4. Choose Custom / No Framework. Deploy the whole course site: app location `/`,
   no API location, and empty output location. These files do not need a build.
5. Let Azure generate its GitHub Actions deployment workflow. Check that the
   workflow finishes successfully. Do not add a second competing workflow.
6. Open Azure's generated HTTPS URL, then its `/milestone3/` path. Test all
   required interactions at that address. Verify the root homepage links to it.
7. Put that exact direct Milestone 3 URL on the first page of the report and
   capture Azure screenshots if required by your instructor. The included report
   is a draft until the actual Azure URL and GitHub submission are verified.

No Azure resource or public GitHub commit was created from this workspace.

## Behavior and request handling

Search trims and validates input, requests only key/title/author_name/cover_i,
and retrieves at most 50 results. Local views show ten records each, including a
short final view. New searches reset to page one. Details use Work IDs and are
loaded only on selection; completed and pending requests are reused. A selection
counter prevents an older response from replacing the latest chosen book.
Requests are serialized with a 1.1-second gap after completion and a 20-second
timeout. Search controls are restored after success or failure. Collection retry
is offered for unavailable or empty collection responses.

API text is inserted as text, not HTML. Description strings and value objects
are supported. Missing authors, descriptions, subjects, covers, and Work IDs
have explicit messages; failed cover loads also show a placeholder. Subjects
are limited to ten. Work covers use covers[], with a search/subject cover fallback.
The science_fiction subject supplies up to ten collection items independently
from keyword searches. Authors reuse names from the search or subject response;
no per-author request is needed.

## Verification

Browser checks with live Open Library data confirmed:
- Empty search validation and a no-match search.
- `tolkien`: 50 accessible records, ten in the first view and five view buttons.
- A two-result search shows only Page 1 of 1 and resets the view.
- Switching to page two preserves the query and displays records 11-20.
- Selecting Tolkien displays its Work ID, authors, cover, ten subjects, external
  link, and missing-description fallback while preserving page two.
- Science Fiction Collection loads ten items with the same card layout.
- Selecting The Time Machine from the collection replaces the shared details.

JavaScript syntax was checked with `node --check milestone3/js/app.js`.
Additional manual checks after deployment: a query with
11-49 results and a short final view, slow/offline API requests, unavailable
covers, string and object descriptions, and rapid changes of selected books.
Do not describe these additional checks as completed until you perform them.

API references:
https://openlibrary.org/dev/docs/api/search
https://openlibrary.org/dev/docs/api/subjects
https://openlibrary.org/dev/docs/api/covers
https://openlibrary.org/developers/api
