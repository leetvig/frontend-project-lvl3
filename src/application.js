import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';

import watcher from './view';

const parser = (xml) => {
  const parserInstance = new DOMParser();
  const rssDocument = parserInstance.parseFromString(xml, 'application/xml');

  const parserError = rssDocument.querySelector('parsererror');
  if (!_.isNull(parserError)) {
    throw new Error();
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

const addRSStoState = (channel, state) => {
  const { feed, posts } = channel;
  state.feeds.unshift({
    title: feed.title,
    description: feed.description,
    id: _.uniqueId(),
  });
  posts.forEach((post) => {
    const { title, description, link } = post;
    state.posts.unshift({
      title, description, link, id: _.uniqueId(),
    });
  });
};

export default () => {
  const state = {
    form: {
      processState: 'filling',
      valid: false,
      error: null,
    },
    channels: [],
    feeds: [],
    posts: [],
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
  };

  const watchedState = watcher(state, elements);

  const validate = (url) => {
    yup.setLocale({
      mixed: {
        notOneOf: 'RSS уже существует',
      },
      string: {
        url: 'Ссылка должна быть валидным URL',
      },
    });

    const schema = yup
      .string()
      .required()
      .url()
      .notOneOf(watchedState.channels);

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
        return axios.get(
          `https://hexlet-allorigins.herokuapp.com/raw?disableCache=true&url=${valid}`,
        );
      })
      .then((responce) => {
        watchedState.form.processState = 'parsing';
        return parser(responce.data);
      })
      .then((channel) => {
        addRSStoState(channel, watchedState);
        watchedState.channels.push(url);
        watchedState.form.processState = 'succeed';
        watchedState.form.error = null;
        watchedState.form.valid = true;
      })
      .catch((err) => {
        watchedState.form.processState = 'failed';
        watchedState.form.valid = false;
        if (err.name === 'Error') {
          watchedState.form.error = 'Ресурс не содержит валидный RSS';
        } else {
          watchedState.form.error = err.message;
        }
      });
  });
};
