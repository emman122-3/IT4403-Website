'use strict';

// Change these Work IDs to personalize the collection. Book titles come from the API.
const bookshelfIds = ['OL45804W', 'OL27448W', 'OL7353617W', 'OL82563W'];
const shelf = document.querySelector('#bookshelf');
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const loadedBooks = new Map();

async function loadBookshelf() {
  retry.hidden = true;
  shelf.replaceChildren();
  status.textContent = 'Loading bookshelf...';
  let failures = 0;
  // Sequential requests with spacing avoid sending a burst to the public API.
  for (const id of bookshelfIds) {
    try {
      let book = loadedBooks.get(id);
      if (!book) {
        book = await getJSON('https://openlibrary.org/works/' + id + '.json');
        loadedBooks.set(id, book);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      shelf.append(bookCard(book, id, firstCover(book)));
    } catch (error) {
      failures++;
      const card = element('article', undefined, 'book-card');
      card.append(element('p', 'Unable to load ' + id + '. Check your connection and retry.'));
      shelf.append(card);
    }
  }
  status.textContent = failures ? (bookshelfIds.length - failures) + ' of ' + bookshelfIds.length + ' books loaded.' : bookshelfIds.length + ' books in this collection.';
  retry.hidden = failures === 0;
}
retry.addEventListener('click', loadBookshelf);
loadBookshelf();
