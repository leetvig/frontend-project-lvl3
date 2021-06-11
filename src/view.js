import onChange from 'on-change';

const createList = (parentNode, title) => {
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  container.innerHTML = `
  <div class="card-body">
    <h2 class="card-title h4">${title}</h2>
  </div>`;

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  container.appendChild(list);

  parentNode.appendChild(container);

  return list;
};

const createFeed = (feed) => `
  <li class="list-group-item border-0 border-end-0">
    <h3 class="h6 m-0">${feed.title}</h3>
    <p class="m-0 small text-black-50">${feed.description}</p>
  </li>`;

const createPost = (post) => `
  <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
    <a
      href=${post.link}
      class="fw-bold"
      target="_blank"
      rel="noopener noreferrer"
      >${post.title}</a
    >
  </li>`;

// Optimize
const renderFeeds = (feeds, elements) => {
  elements.feedsContainer.innerHTML = '';
  const feedsList = createList(elements.feedsContainer, 'Новостные каналы');
  feedsList.innerHTML = feeds.map((feed) => createFeed(feed)).join('\n');
};

const renderPosts = (posts, elements) => {
  elements.postsContainer.innerHTML = '';
  const postsList = createList(elements.postsContainer, 'Посты');
  postsList.innerHTML = posts.map((post) => createPost(post)).join('\n');
};

const renderFeedback = (valid, elements) => {
  if (valid) {
    elements.feedback.classList.remove('text-danger');
    elements.feedback.classList.add('text-success');
    elements.feedback.textContent = 'RSS успешно загружен';
  } else {
    elements.feedback.classList.remove('text-success');
    elements.feedback.classList.add('text-danger');
  }
};

const processStateHandler = (processState, elements) => {
  switch (processState) {
    case 'filling':
      elements.form.submit.removeAttribute('disabled');
      elements.form.input.removeAttribute('readonly');
      break;
    case 'sending':
    case 'parsing':
    case 'validation':
      elements.form.submit.setAttribute('disabled', true);
      elements.form.input.setAttribute('readonly', true);
      break;
    case 'succeed':
      elements.form.submit.removeAttribute('disabled');
      elements.form.input.removeAttribute('readonly');
      elements.form.input.classList.remove('is-invalid');
      elements.form.input.value = '';
      elements.form.input.focus();
      break;
    case 'failed':
      elements.form.submit.removeAttribute('disabled');
      elements.form.input.removeAttribute('readonly');
      elements.form.input.classList.add('is-invalid');
      elements.form.input.focus();
      break;
    default:
      throw new Error(`Unknown state ${processState}`);
  }
};

export default (state, elements) =>
  onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        renderFeeds(value, elements);
        break;
      case 'posts':
        renderPosts(value, elements);
        break;
      case 'form.processState':
        processStateHandler(value, elements);
        break;
      case 'form.valid':
        renderFeedback(value, elements);
        break;
      case 'form.error':
        if (value) {
          elements.feedback.textContent = value;
        }
        break;
      default:
        break;
    }
  });
