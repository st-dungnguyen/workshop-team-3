const RESOURCES = {
  auth: 'auth',
  article: 'posts',
};

export const ENDPOINT = {
  auth: {
    index: `${RESOURCES.auth}`,
    login: `${RESOURCES.auth}/login`,
    validate: `${RESOURCES.auth}/validate`,
  },
  article: {
    articleList: `${RESOURCES.article}`,
  },
};
