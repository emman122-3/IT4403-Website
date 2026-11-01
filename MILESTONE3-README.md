# Milestone 3 - Open Library Single Page Application

Emmanuel Osime | IT 4403 | W01 (85564) | Fall 2026

## Overview

This application combines book search, pagination, selected-book details, and a predefined science fiction collection on one webpage. It uses HTML, CSS, JavaScript, and jQuery AJAX to retrieve live information from Open Library without full-page reloads.

Milestone 3 has its own folder and stylesheet. Milestone 2 remains unchanged.

## Project Files

- `milestone3/index.html`: the single-page interface.
- `milestone3/style.css`: application styling and responsive layouts.
- `milestone3/js/app.js`: API requests, search, pagination, details, and application states.
- `milestone3/vendor/jquery-3.7.1.min.js`: jQuery library.
- Root `index.html` and `projects.html`: navigation links to Milestone 3.

Only jQuery is used as an application library. No build step is required.

## Running Locally

From the project folder, run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/milestone3/` in a browser. Internet access is required for book data and cover images.

## Book Search and Pagination

The search form accepts a title or keywords and validates the input before sending a request. Search requests use jQuery AJAX and retrieve up to 50 results. Each result displays a selectable title and a cover image when available.

Results appear in groups of ten. The application provides only the required number of views and displays the current page. Changing views preserves the search term. A new search replaces previous results and returns to page one.

## Selected-Book Details

Selecting a book requests its Work record and updates the shared details section. The current search results and pagination view remain available.

Details include:

- Title and Open Library Work ID.
- Author names when available.
- Description when available.
- Up to ten subjects.
- Cover image when available.
- A link to the book's Open Library page.

Descriptions returned as strings or objects containing a `value` property are supported. Author names are reused from search or collection responses. Previously retrieved details are cached, and older responses cannot replace a more recent selection.

## Science Fiction Collection

The collection retrieves up to ten books from the Open Library `science_fiction` subject. Collection cards use the same layout as search results. Selecting a collection title updates the same details section. The collection remains independent of keyword searches.

## Loading, Errors, and Missing Information

The application displays messages for invalid input, loading, no matching results, request failures, and empty or unavailable collections. Missing authors, descriptions, subjects, covers, and Work IDs receive fallback messages. Failed cover-image loads display a placeholder.

Search controls are disabled during a search and restored when the request finishes. Data requests use HTTPS, run sequentially with a 1.1-second gap after completion, and have a 20-second timeout. Book details load only when selected.

## Verification

Browser checks using live Open Library data confirmed:

- Empty-input validation and a no-match message.
- A `tolkien` search with 50 accessible results and five views.
- Ten results per view and a visible current-page indicator.
- A two-result search with only Page 1 of 1.
- Preservation of the query and page when displaying book details.
- A missing-description fallback in a selected Work record.
- Ten collection items and selection from the collection.

JavaScript syntax was checked using:

```bash
node --check milestone3/js/app.js
```

Additional checks after deployment include a shorter final view for 11-49 results, unavailable covers, failed requests, both description formats, and rapid changes of selected books.

## Hosting and Repository

Repository: https://github.com/emman122-3/IT4403-Website

The application is prepared for Azure Static Web Apps. For deployment of the complete course website, use `/` as the app location, no API location, and an empty output location. The application is accessed through the deployed site's `/milestone3/` path.

GitHub publication of this version and Azure deployment are pending verification.

## API References

- [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
- [Open Library Subjects API](https://openlibrary.org/dev/docs/api/subjects)
- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers)
- [Open Library APIs](https://openlibrary.org/developers/api)
