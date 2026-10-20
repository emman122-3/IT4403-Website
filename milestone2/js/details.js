'use strict';

async function loadDetails() {
  const status = document.querySelector('#status');
  const container = document.querySelector('#book-details');
  const id = workId(new URLSearchParams(location.search).get('id'));
  if (!id) {
    status.textContent = 'No valid book was selected. Use Home or My Bookshelf to choose a book.';
    return;
  }
  try {
    const savedSearch = sessionStorage.getItem('openLibrarySearch');
    if (savedSearch) document.querySelector('#back-link').href = 'index.html?' + savedSearch;
  } catch (error) { /* Search still works when browser storage is disabled. */ }
  try {
    const book = await getJSON('https://openlibrary.org/works/' + id + '.json');
    const title = book.title || 'Title unavailable';
    document.title = title + ' | Open Library';
    container.append(coverImage(firstCover(book), title, 'M'));
    const content = element('div');
    content.append(element('h2', title), element('p', 'Work ID: ' + id));
    content.append(element('h3', 'Description'));
    const description = typeof book.description === 'string' ? book.description : book.description?.value;
    content.append(element('p', typeof description === 'string' && description.trim() ? description : 'Description unavailable.', 'description'));
    content.append(element('h3', 'Subjects'));
    if (Array.isArray(book.subjects) && book.subjects.length) {
      const list = element('ul', undefined, 'subjects');
      for (const subject of book.subjects.slice(0, 10)) list.append(element('li', subject));
      content.append(list);
    } else {
      content.append(element('p', 'Subjects unavailable.'));
    }
    const link = element('a', 'View this book on Open Library');
    link.href = 'https://openlibrary.org/works/' + id;
    content.append(link);
    container.append(content);
    container.hidden = false;
    status.textContent = '';
  } catch (error) {
    status.textContent = 'Unable to load this book. Check your connection and reload the page to try again.';
  }
}
loadDetails();
