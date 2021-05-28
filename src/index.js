// CSS
import "bootstrap/dist/css/bootstrap.min.css";
// JS lib
import onChange from "on-change";
import * as yup from "yup";
import axios from "axios";
import _ from "lodash";

// Validator
const schema = yup.string().required().url();

const validate = (url) => {
  try {
    schema.validateSync(url);
    return {};
  } catch (e) {
    return e.message;
  }
};

// View
const state = {
  form: {
    processState: "empty",
    processError: null,
    url: "",
    valid: false,
    errors: {},
  },
  channels: [],
};

// View
const renderChannels = (channels) => {

};

const watchedState = onChange(state, (path, value) => {
  switch (path) {
    case "channels":
      renderChannels(value);
      break;

    default:
      break;
  }
});

// Parser
const parse = (xml) => {
  const parser = new DOMParser();
  const rssDocement = parser.parseFromString(xml, "application/xml");

  const rssChannel = {
    title: "",
    description: "",
    posts: [],
  };

  rssChannel.title = rssDocement.querySelector("title").textContent;
  rssChannel.description = rssDocement.querySelector("description").textContent;

  const posts = rssDocement.querySelectorAll("item");

  posts.forEach((postHTML) => {
    const post = {
      title: "",
      description: "",
      link: "",
      date: "",
    };
    post.title = postHTML.querySelector("title").textContent;
    post.description = postHTML.querySelector("description").textContent;
    post.link = postHTML.querySelector("link").textContent;
    post.date = postHTML.querySelector("pubDate").textContent;

    rssChannel.posts.push(post);
  });

  return rssChannel;
};

//Controller
const form = document.querySelector(".rss-form");
const urlInput = document.querySelector('input[type="url"]');

form.addEventListener("submit", (e) => {
  e.preventDefault();
  watchedState.form.url = urlInput.value;

  axios.get(watchedState.form.url).then((responce) => {
    console.log(responce.status);
    watchedState.channels.push(parse(responce.data));
  });
});
