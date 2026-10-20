'use strict';

function workId(key) {
  const id = String(key || '').replace(/^\/works\//, '');
  return /^OL\d+W$/.test(id) ? id : '';
}

async function getJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function coverImage(coverId, title, size = 'S') {
  const box = element('div', 'Cover unavailable', 'cover');
  if (Number.isInteger(coverId) && coverId > 0) {
    const image = document.createElement('img');
    image.alt = 'Cover of ' + title;
    image.loading = 'lazy';
    image.src = 'https://covers.openlibrary.org/b/id/' + coverId + '-' + size + '.jpg?default=false';
    image.addEventListener('error', () => box.replaceChildren(document.createTextNode('Cover unavailable')));
    box.replaceChildren(image);
  }
  return box;
}

function firstCover(book) {
  return Array.isArray(book.covers) ? book.covers.find(id => Number.isInteger(id) && id > 0) : null;
}

function bookCard(book, id, coverId) {
  const card = element('article', undefined, 'book-card');
  const title = book.title || 'Title unavailable';
  card.append(coverImage(coverId, title));
  const content = element('div');
  const heading = element('h2');
  const link = element('a', title);
  link.href = 'book.html?id=' + encodeURIComponent(id);
  heading.append(link);
  content.append(heading, element('p', 'Work ID: ' + id));
  card.append(content);
  return card;
}
