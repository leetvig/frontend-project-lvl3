import 'bootstrap/js/dist/modal';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import i18n from 'i18next';

import resources from './locales';
import watcher from './view';

const addProxy = (url) => {
  const proxyURL = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');
  proxyURL.searchParams.set('url', url);
  proxyURL.searchParams.set('disableCache', true);
  return proxyURL.toString();
};

const fetchData = (url) => {
  const proxyURL = addProxy(url);
  return axios.get(proxyURL);
};

const parser = (xml) => {
  const parserInstance = new DOMParser();
  const rssDocument = parserInstance.parseFromString(xml, 'application/xml');

  const parserError = rssDocument.querySelector('parsererror');
  if (!_.isNull(parserError)) {
    const e = new Error();
    e.name = 'ParseError';
    e.message = parserError.textContent;
    throw e;
  }

  const title = rssDocument.querySelector('title').textContent;
  const description = rssDocument.querySelector('description').textContent;
  const feed = { title, description };
  const items = rssDocument.querySelectorAll('item');

  const posts = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));

  return { feed, posts };
};

const addRSStoState = (url, channel, state) => {
  const { feed, posts } = channel;
  const feedId = state.feeds.length + 1;

  state.feeds.unshift({
    title: feed.title,
    description: feed.description,
    url,
    id: feedId,
  });

  posts.forEach((post) => {
    const { title, description, link } = post;
    state.posts.unshift({
      title,
      description,
      link,
      feedId,
      id: _.uniqueId(),
      isViewed: false,
    });
  });
};

const updatePosts = (state) => {
  const { feeds, posts } = state;
  const promisess = feeds.map((feed) => fetchData(feed.url)
    .then((responce) => parser(responce.data.contents))
    .then((channel) => {
      const newPosts = channel.posts;
      const oldPosts = posts.filter((post) => post.feedId === feed.id);
      const diffPosts = _.differenceBy(newPosts, oldPosts, 'link').map(
        (post) => ({ ...post, id: _.uniqueId(), feedId: feed.id }),
      );
      state.posts.unshift(...diffPosts);
    }));

  Promise.all(promisess).finally(() => setTimeout(() => updatePosts(state), 5000));
};

export default () => {
  const state = {
    form: {
      processState: 'filling',
      valid: false,
      error: null,
    },
    feeds: [],
    posts: [],
    modalPost: null,
    viewedPosts: new Set(),
  };

  const form = document.querySelector('.rss-form');
  const elements = {
    form: {
      input: document.querySelector('#url-input'),
      submit: document.querySelector('button[type="submit"]'),
    },
    feedback: document.querySelector('.feedback'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: {
      title: document.querySelector('.modal-title'),
      description: document.querySelector('.modal-body'),
      link: document.querySelector('.full-article'),
    },
  };

  const i18nInstance = i18n.createInstance();

  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then((t) => {
      const watchedState = watcher(state, elements, t);

      const validate = (url) => {
        yup.setLocale({
          mixed: {
            notOneOf: t('validateError.notOneOf'),
            required: t('validateError.required'),
          },
          string: {
            url: t('validateError.url'),
          },
        });

        const schema = yup
          .string()
          .required()
          .url()
          .notOneOf(watchedState.feeds.map((feed) => feed.url));

        return schema.validate(url);
      };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        watchedState.form.processState = 'validation';

        validate(url)
          .then((valid) => {
            watchedState.form.processState = 'sending';
            return fetchData(valid);
          })
          .then((responce) => {
            watchedState.form.processState = 'parsing';
            return parser(responce.data.contents);
          })
          .then((channel) => {
            addRSStoState(url, channel, watchedState);
            watchedState.form.processState = 'succeed';
            watchedState.form.error = null;
            watchedState.form.valid = true;
          })
          .catch((err) => {
            watchedState.form.processState = 'failed';
            watchedState.form.valid = false;
            if (err.name === 'ValidationError') {
              watchedState.form.error = err.message;
            } else if (err.name === 'ParseError') {
              watchedState.form.error = t('parserError');
            } else if (err.message === 'Network Error') {
              watchedState.form.error = t('networkError');
            } else {
              watchedState.form.error = t('unknownError');
            }
          });
      });
      elements.postsContainer.addEventListener('click', (evt) => {
        const dataId = evt.target.dataset.id;
        if (_.isUndefined(dataId)) {
          return;
        }
        const targetType = evt.target.getAttribute('type');
        const viewedPost = _.find(watchedState.posts, { id: dataId });
        if (targetType === 'button') {
          watchedState.modalPost = viewedPost;
        }
        viewedPost.isViewed = true;
        watchedState.viewedPosts.add(dataId);
      });
      updatePosts(watchedState);
    });
};
