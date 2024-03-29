import onChange from 'on-change';

const createList = (parentNode, title) => {
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = title;
  cardBody.append(cardTitle);

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  container.append(cardBody, list);

  parentNode.appendChild(container);
  return list;
};

const createFeed = (feed) => `
  <li class="list-group-item border-0 border-end-0">
    <h3 class="h6 m-0">${feed.title}</h3>
    <p class="m-0 small text-black-50">${feed.description}</p>
  </li>`;

const createPost = (post, viewedPosts) => `
  <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
    <a
      href=${post.link}
      class="${
  viewedPosts.has(post.id) ? 'fw-normal link-secondary' : 'fw-bold'
}"
      data-id=${post.id}
      target="_blank"
      rel="noopener noreferrer"
    >
    ${post.title}
    </a>
    <button
      type="button"
      class="btn btn-outline-primary btn-sm"
      data-id=${post.id}
      data-bs-toggle="modal"
      data-bs-target="#modal"
    >
      Просмотр
    </button>
  </li>`;

const renderList = (
  list,
  container,
  title,
  renderFunction,
  viewedPosts = null,
) => {
  container.innerHTML = '';
  const listContainer = createList(container, title);
  listContainer.innerHTML = list
    .map((item) => renderFunction(item, viewedPosts))
    .join('\n');
};

const renderFeedback = (valid, elements, text) => {
  if (valid) {
    elements.feedback.classList.remove('text-danger');
    elements.feedback.classList.add('text-success');
    elements.feedback.textContent = text;
  } else {
    elements.feedback.classList.remove('text-success');
    elements.feedback.classList.add('text-danger');
  }
};

const renderViewedPosts = (viewedPosts) => {
  viewedPosts.forEach((id) => {
    const link = document.querySelector(`a[data-id="${id}"]`);
    if (link) {
      link.classList.replace('fw-bold', 'fw-normal');
      link.classList.add('link-secondary');
    }
  });
};

const lockFormUI = (lock, elements) => {
  if (lock) {
    elements.form.submit.setAttribute('disabled', true);
    elements.form.input.setAttribute('readonly', true);
  } else {
    elements.form.submit.removeAttribute('disabled');
    elements.form.input.removeAttribute('readonly');
  }
};

const fillModal = (id, posts, elements) => {
  const post = posts.find((item) => item.id === id);
  elements.modal.title.textContent = post.title;
  elements.modal.description.textContent = post.description;
  elements.modal.link.setAttribute('href', post.link);
};

const processStateHandler = (processState, elements) => {
  switch (processState) {
    case 'filling':
      lockFormUI(false, elements);
      break;
    case 'sending':
    case 'parsing':
    case 'validation':
      lockFormUI(true, elements);
      break;
    case 'succeed':
      lockFormUI(false, elements);
      elements.form.input.classList.remove('is-invalid');
      elements.form.input.value = '';
      elements.form.input.focus();
      break;
    case 'failed':
      lockFormUI(false, elements);
      elements.form.input.classList.add('is-invalid');
      elements.form.input.focus();
      break;
    default:
      throw new Error(`Unknown state ${processState}`);
  }
};

export default (state, elements, t) => onChange(state, (path, value) => {
  switch (path) {
    case 'feeds':
      renderList(value, elements.feedsContainer, t('feedsTitle'), createFeed);
      break;
    case 'posts':
      renderList(
        value,
        elements.postsContainer,
        t('postsTitle'),
        createPost,
        state.viewedPosts,
      );
      break;
    case 'form.processState':
      processStateHandler(value, elements);
      break;
    case 'form.valid':
      renderFeedback(value, elements, t('success'));
      break;
    case 'form.error':
      elements.feedback.textContent = t(value);
      break;
    case 'viewedPosts':
      renderViewedPosts(value);
      break;
    case 'modalPost':
      fillModal(value, state.posts, elements);
      break;
    default:
      break;
  }
});
