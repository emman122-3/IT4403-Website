/* Open Library Milestone 4: jQuery AJAX data and Mustache templates. */
$(function () {
  "use strict";

  const api = "https://openlibrary.org";
  const pageSize = 10;
  const bookTemplate = $("#book-template").html();
  const detailTemplate = $("#detail-template").html();
  const partials = { cover: $("#cover-template").html() };
  let results = [];
  let collection = [];
  let currentPage = 1;
  let searchTerm = "";
  let searching = false;
  let loadingCollection = false;
  let collectionRequested = false;
  let selectedControl = null;
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
    const id = typeof book.key === "string" ? book.key.replace(/^\/works\//, "") : "";
    const authors = strings(book.author_name);
    const collectionAuthors = Array.isArray(book.authors) ?
      strings(book.authors.map(function (author) { return author && author.name; })) : [];
    return {
      key: /^OL\d+W$/.test(id) ? "/works/" + id : "",
      title: typeof book.title === "string" && book.title.trim() ? book.title : "Untitled book",
      authors: authors.length ? authors : collectionAuthors,
      cover: book.cover_i || book.cover_id,
      year: book.first_publish_year,
      languages: strings(book.language)
    };
  }

  function validCover(value) {
    return Number.isInteger(Number(value)) && Number(value) > 0;
  }

  function coverUrl(id) {
    return validCover(id) ? "https://covers.openlibrary.org/b/id/" + Number(id) + "-M.jpg?default=false" : "";
  }

  function render(target, template, view) {
    const container = $(target).empty();
    const fragment = document.createElement("template");
    fragment.innerHTML = Mustache.render(template, view, partials);
    // Attach listeners before inserting images so cached failures are handled too.
    $(fragment.content.querySelectorAll(".cover img")).on("error load", function (event) {
      if (event.type === "error" || this.naturalWidth <= 1) {
        $(this).siblings("span").prop("hidden", false);
        $(this).remove();
      }
    });
    container[0].append(fragment.content);
  }

  // Search and subject collection items share the same Mustache template.
  function showBooks(target, books) {
    render(target, bookTemplate, {books: books.map(function (book, index) {
      return {
        slot: book.key ? index + 1 : null,
        title: book.title,
        authorText: book.authors.join(", ") || "Author information unavailable.",
        coverUrl: coverUrl(book.cover),
        year: book.year
      };
    })});
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
    const buttons = $("<div>").addClass("page-buttons").appendTo(pagination);
    function pageButton(label, destination, disabled, active) {
      const button = $("<button>").attr("type", "button").text(label).prop("disabled", disabled);
      if (active) button.attr("aria-current", "page");
      button.on("click", function () { showPage(destination, true); }).appendTo(buttons);
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
    switchSection("search");
    searching = true;
    searchTerm = term;
    results = [];
    currentPage = 1;
    $("#search-input").removeAttr("aria-invalid").prop("disabled", true);
    $("#search-button").prop("disabled", true).text("Searching…");
    $("#results").empty().attr("aria-busy", "true");
    $("#pagination").empty().prop("hidden", true);
    message("#search-status", "Loading books for “" + term + "”…");
    request("/search.json", { q: term, limit: 50, fields: "key,title,author_name,cover_i,first_publish_year,language" })
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
    const cover = Array.isArray(work.covers) ? work.covers.find(validCover) : null;
    const title = typeof work.title === "string" && work.title.trim() ? work.title : book.title;
    const raw = typeof work.description === "string" ? work.description : work.description && work.description.value;
    const subjects = strings(work.subjects).slice(0, 10);
    render("#book-details", detailTemplate, {
      title: title,
      workId: book.key.split("/").pop(),
      authorText: book.authors.join(", ") || "Author information unavailable.",
      coverUrl: coverUrl(cover || book.cover),
      description: typeof raw === "string" && raw.trim() ? raw : "No description is available for this book.",
      subjects: subjects,
      hasSubjects: subjects.length > 0,
      published: work.first_publish_date || book.year,
      language: book.languages.join(", "),
      recordUrl: api + book.key
    });
    message("#details-status", "");
    $("#details-status").prop("hidden", true);
  }

  function selectBook(book, control) {
    const selection = ++selectionNumber;
    selectedControl = control;
    $("#back-to-books").prop("hidden", false);
    $("#details-status").prop("hidden", false);
    $("#book-details").empty().attr("aria-busy", "true");
    message("#details-status", "Loading details for “" + book.title + "”…");
    $("#details")[0].focus({preventScroll: true});
    $("#details")[0].scrollIntoView({block: "nearest"});
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
    collectionRequested = true;
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

  function switchSection(section) {
    $("#search").prop("hidden", section !== "search");
    $("#collection").prop("hidden", section !== "collection");
    $(".views button").each(function () {
      $(this).attr("aria-pressed", String(this.dataset.section === section));
    });
    if (section === "collection" && !collectionRequested) loadCollection();
  }

  $(".views").on("click", "button[data-section]", function () {
    switchSection(this.dataset.section);
  });

  $(".layout-picker").on("click", "button[data-layout]", function () {
    const layout = this.dataset.layout;
    const picker = $(this).closest(".layout-picker");
    picker.find("button").attr("aria-pressed", "false");
    $(this).attr("aria-pressed", "true");
    picker.closest(".browsing").find(".books").attr("data-layout", layout);
  });

  $("#results").on("click", ".book-select", function () {
    const index = (currentPage - 1) * pageSize + Number(this.dataset.slot) - 1;
    selectBook(results[index], this);
  });
  $("#collection-books").on("click", ".book-select", function () {
    selectBook(collection[Number(this.dataset.slot) - 1], this);
  });
  $("#back-to-books").on("click", function () {
    const visibleSection = $(".browsing:not([hidden])")[0];
    if (visibleSection.contains(selectedControl)) {
      selectedControl.focus();
    } else {
      $(".views button[aria-pressed='true']").trigger("focus");
    }
  });
  $("#collection-retry").on("click", loadCollection);
});
