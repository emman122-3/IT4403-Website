/* Open Library Milestone 3: one page, with jQuery AJAX for all book data. */
$(function () {
  "use strict";

  const api = "https://openlibrary.org";
  const pageSize = 10;
  let results = [];
  let collection = [];
  let currentPage = 1;
  let searchTerm = "";
  let searching = false;
  let loadingCollection = false;
  let selectionNumber = 0;
  const detailCache = new Map();
  const pendingDetails = new Map();
  const requestQueue = [];
  let requestRunning = false;

  // Serialize data requests and leave a gap to respect the public API limit.
  // Cover images are loaded by the browser only when they approach the viewport.
  function request(path, data) {
    const deferred = $.Deferred();
    requestQueue.push({ path: path, data: data, deferred: deferred });
    runNextRequest();
    return deferred.promise();
  }

  function runNextRequest() {
    if (requestRunning || !requestQueue.length) return;
    requestRunning = true;
    const next = requestQueue.shift();
    $.ajax({ url: api + next.path, data: next.data, dataType: "json", timeout: 20000 })
      .done(function (data) { next.deferred.resolve(data); })
      .fail(function (xhr, status) { next.deferred.reject(xhr, status); })
      .always(function () {
        window.setTimeout(function () {
          requestRunning = false;
          runNextRequest();
        }, 1100);
      });
  }

  function message(selector, text, error) {
    $(selector).text(text).toggleClass("error", !!error);
  }

  function strings(value) {
    return Array.isArray(value) ? value.filter(function (item) {
      return typeof item === "string" && item.trim();
    }) : [];
  }

  function normalizeBook(book) {
    book = book || {};
    const key = typeof book.key === "string" ? book.key : "";
    return {
      key: /^\/works\/OL\d+W$/.test(key) ? key : "",
      title: typeof book.title === "string" && book.title.trim() ? book.title : "Untitled book",
      authors: strings(book.author_name).length ? strings(book.author_name) :
        strings(Array.isArray(book.authors) ? book.authors.map(function (author) { return author && author.name; }) : []),
      cover: book.cover_i || book.cover_id
    };
  }

  function validCover(value) {
    return Number.isInteger(Number(value)) && Number(value) > 0;
  }

  function makeCover(id, title, large) {
    const box = $("<div>").addClass("cover");
    const fallback = function () { box.empty().text("Cover unavailable"); };
    if (!validCover(id)) {
      fallback();
    } else {
      $("<img>").attr({
        src: "https://covers.openlibrary.org/b/id/" + Number(id) + (large ? "-M.jpg" : "-S.jpg") + "?default=false",
        alt: "Cover of " + title,
        loading: "lazy"
      }).on("error", fallback).on("load", function () {
        if (this.naturalWidth <= 1) fallback();
      }).appendTo(box);
    }
    return box;
  }

  // Search and subject collection items deliberately share this renderer.
  function showBooks(target, books) {
    const container = $(target).empty();
    books.forEach(function (book) {
      const card = $("<article>").addClass("book-card");
      card.append(makeCover(book.cover, book.title, false));
      const text = $("<div>");
      const heading = $("<h4>");
      if (book.key) {
        $("<button>").attr("type", "button").addClass("book-select")
          .text(book.title).on("click", function () { selectBook(book); }).appendTo(heading);
      } else {
        heading.text(book.title);
      }
      text.append(heading, $("<p>").text(book.authors.join(", ") || "Author information unavailable."));
      if (!book.key) text.append($("<p>").text("Work ID unavailable; details cannot be loaded."));
      card.append(text).appendTo(container);
    });
  }

  function showPage(page, moveFocus) {
    const totalPages = Math.ceil(results.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    const start = (page - 1) * pageSize;
    showBooks("#results", results.slice(start, start + pageSize));
    message("#search-status", "Showing " + (start + 1) + "-" + Math.min(start + pageSize, results.length) +
      " of " + results.length + " accessible results for “" + searchTerm + "”.");
    const pagination = $("#pagination").empty().prop("hidden", false);
    $("<span>").addClass("page-indicator").attr({role: "status", "aria-live": "polite"})
      .text("Page " + page + " of " + totalPages).appendTo(pagination);
    function pageButton(label, destination, disabled, active) {
      const button = $("<button>").attr("type", "button").text(label).prop("disabled", disabled);
      if (active) button.attr("aria-current", "page");
      button.on("click", function () { showPage(destination, true); }).appendTo(pagination);
    }
    pageButton("Previous", page - 1, page === 1, false);
    for (let number = 1; number <= totalPages; number++) {
      pageButton(String(number), number, false, number === page);
    }
    pageButton("Next", page + 1, page === totalPages, false);
    if (moveFocus) pagination.find('[aria-current="page"]').trigger("focus");
  }

  $("#search-form").on("submit", function (event) {
    event.preventDefault();
    if (searching) return;
    const term = $("#search-input").val().trim();
    if (!term || term.length > 200 || !/[\p{L}\p{N}]/u.test(term)) {
      message("#search-status", "Enter a title or keywords containing a letter or number (up to 200 characters).", true);
      $("#search-input").attr("aria-invalid", "true").trigger("focus");
      return;
    }
    searching = true;
    searchTerm = term;
    results = [];
    currentPage = 1;
    $("#search-input").removeAttr("aria-invalid").prop("disabled", true);
    $("#search-button").prop("disabled", true).text("Searching…");
    $("#results").empty().attr("aria-busy", "true");
    $("#pagination").empty().prop("hidden", true);
    message("#search-status", "Loading books for “" + term + "”…");
    request("/search.json", { q: term, limit: 50, fields: "key,title,author_name,cover_i" })
      .done(function (data) {
        if (!data || !Array.isArray(data.docs)) {
          message("#search-status", "Open Library returned an unexpected response. Please try again.", true);
          return;
        }
        results = data.docs.slice(0, 50).map(normalizeBook);
        if (!results.length) {
          message("#search-status", "No books matched “" + term + "”. Try a different title or keywords.");
        } else {
          showPage(1, false);
        }
      })
      .fail(function () { message("#search-status", "Search could not be loaded. Check your connection and try again.", true); })
      .always(function () {
        searching = false;
        $("#search-input, #search-button").prop("disabled", false);
        $("#search-button").text("Search");
        $("#results").attr("aria-busy", "false");
      });
  });

  function showDetails(book, work) {
    const layout = $("<div>").addClass("detail-layout");
    const cover = Array.isArray(work.covers) ? work.covers.find(validCover) : null;
    layout.append(makeCover(cover || book.cover, book.title, true));
    const text = $("<div>");
    $("<h3>").text(typeof work.title === "string" && work.title.trim() ? work.title : book.title).appendTo(text);
    $("<p>").append($("<strong>").text("Work ID: "), document.createTextNode(book.key.split("/").pop())).appendTo(text);
    $("<p>").append($("<strong>").text("Author(s): "), document.createTextNode(book.authors.join(", ") || "Author information unavailable.")).appendTo(text);
    const raw = typeof work.description === "string" ? work.description : work.description && work.description.value;
    $("<h4>").text("Description").appendTo(text);
    $("<p>").addClass("description").text(typeof raw === "string" && raw.trim() ? raw : "No description is available for this book.").appendTo(text);
    $("<h4>").text("Subjects").appendTo(text);
    const subjects = strings(work.subjects).slice(0, 10);
    if (subjects.length) {
      const list = $("<ul>").addClass("subjects");
      subjects.forEach(function (subject) { list.append($("<li>").text(subject)); });
      text.append(list);
    } else {
      text.append($("<p>").text("No subjects are available for this book."));
    }
    text.append($("<a>").attr({href: api + book.key, target: "_blank", rel: "noopener noreferrer"}).text("View this book on Open Library ↗"));
    layout.append(text);
    $("#book-details").empty().append(layout);
    message("#details-status", "Details for “" + book.title + "”.");
  }

  function selectBook(book) {
    const selection = ++selectionNumber;
    $("#book-details").empty().attr("aria-busy", "true");
    message("#details-status", "Loading details for “" + book.title + "”…");
    $("#details")[0].scrollIntoView({block: "start"});
    $("#details").trigger("focus");
    if (detailCache.has(book.key)) {
      showDetails(book, detailCache.get(book.key));
      $("#book-details").attr("aria-busy", "false");
      return;
    }
    // Share pending requests and ignore stale responses after another selection.
    if (!pendingDetails.has(book.key)) {
      const pending = request(book.key + ".json");
      pendingDetails.set(book.key, pending);
      pending.done(function (work) {
        if (work && typeof work === "object" && !Array.isArray(work) && !work.error) detailCache.set(book.key, work);
      }).always(function () { pendingDetails.delete(book.key); });
    }
    pendingDetails.get(book.key).done(function (work) {
      if (selection !== selectionNumber) return;
      if (!detailCache.has(book.key)) {
        message("#details-status", "Book details are unavailable. Select another book or try again.", true);
        return;
      }
      showDetails(book, work);
    }).fail(function () {
      if (selection === selectionNumber) message("#details-status", "Book details could not be loaded. Select the book again to retry.", true);
    }).always(function () {
      if (selection === selectionNumber) $("#book-details").attr("aria-busy", "false");
    });
  }

  function loadCollection() {
    if (loadingCollection) return;
    loadingCollection = true;
    $("#collection-retry").prop("hidden", true);
    $("#collection-books").empty().attr("aria-busy", "true");
    message("#collection-status", "Loading the science fiction collection…");
    request("/subjects/science_fiction.json", {limit: 10})
      .done(function (data) {
        if (!data || !Array.isArray(data.works)) {
          message("#collection-status", "The collection is unavailable. Please try again.", true);
          $("#collection-retry").prop("hidden", false);
          return;
        }
        collection = data.works.slice(0, 10).map(normalizeBook);
        showBooks("#collection-books", collection);
        message("#collection-status", collection.length ? collection.length + " books in the Science Fiction Collection. Select a title to explore." : "No books are currently available in this collection.");
        $("#collection-retry").prop("hidden", collection.length > 0);
      })
      .fail(function () {
        message("#collection-status", "The collection could not be loaded. Check your connection and try again.", true);
        $("#collection-retry").prop("hidden", false);
      })
      .always(function () {
        loadingCollection = false;
        $("#collection-books").attr("aria-busy", "false");
      });
  }

  $("#collection-retry").on("click", loadCollection);
  loadCollection();
});
