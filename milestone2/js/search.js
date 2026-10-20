'use strict';

const pageSize = 10;
const maximumResults = 60;
const form = document.querySelector('#search-form');
const queryInput = document.querySelector('#query');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const pagination = document.querySelector('#pagination');
const pageSelect = document.querySelector('#page-number');
let searchTerm = '';
let requestNumber = 0;
const cachedPages = new Map();

async function search(page) {
  const thisRequest = ++requestNumber;
  results.replaceChildren();
  status.textContent = 'Searching Open Library...';
  pageSelect.disabled = true;
  const parameters = new URLSearchParams({ q: searchTerm, limit: pageSize, page: page, fields: 'key,title,cover_i' });
  const url = 'https://openlibrary.org/search.json?' + parameters;
  try {
    const data = cachedPages.get(url) || await getJSON(url);
    if (thisRequest !== requestNumber) return;
    if (!Array.isArray(data.docs)) throw new Error('Invalid search response');
    cachedPages.set(url, data);
    const total = Math.min(maximumResults, Math.max(0, Number(data.numFound ?? data.num_found) || 0));
    const pages = Math.ceil(total / pageSize);
    pageSelect.replaceChildren();
    for (let number = 1; number <= pages; number++) {
      const option = element('option', 'Page ' + number + ' of ' + pages);
      option.value = number;
      pageSelect.append(option);
    }
    pageSelect.value = String(page);
    pagination.hidden = pages < 2;
    // Only this page is requested. Across six pages, at most 60 records appear.
    for (const book of data.docs.slice(0, Math.min(pageSize, maximumResults - (page - 1) * pageSize))) {
      const id = workId(book.key);
      if (id) results.append(bookCard(book, id, book.cover_i));
    }
    const count = results.children.length;
    status.textContent = count
      ? 'Showing ' + ((page - 1) * pageSize + 1) + '–' + ((page - 1) * pageSize + count) + ' of ' + total + ' available matches for “' + searchTerm + '” (maximum 60).'
      : 'No results found. Try another title, author, or keyword.';
    const state = new URLSearchParams({ q: searchTerm, page: page });
    history.replaceState(null, '', 'index.html?' + state);
    try { sessionStorage.setItem('openLibrarySearch', state.toString()); } catch (error) { /* Storage is optional. */ }
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    status.textContent = 'Unable to load results. Check your connection and select Search to try again.';
  } finally {
    if (thisRequest === requestNumber) pageSelect.disabled = false;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  searchTerm = queryInput.value.trim();
  pagination.hidden = true;
  if (!searchTerm) {
    requestNumber++;
    results.replaceChildren();
    status.textContent = 'Please enter a title, author, or keyword.';
    queryInput.focus();
    return;
  }
  search(1);
});
pageSelect.addEventListener('change', () => search(Number(pageSelect.value)));
const initial = new URLSearchParams(location.search);
if (initial.get('q')?.trim()) {
  searchTerm = initial.get('q').trim();
  queryInput.value = searchTerm;
  const page = Math.min(6, Math.max(1, parseInt(initial.get('page'), 10) || 1));
  search(page);
}
