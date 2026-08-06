const RESOURCES = {
  auth: 'auth',
  article: 'posts',
};

export const ENDPOINT = {
  auth: {
    index: `${RESOURCES.auth}`,
    login: `${RESOURCES.auth}/login`,
  },
  article: {
    articleList: `${RESOURCES.article}`,
  },
};
