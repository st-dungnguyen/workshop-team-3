const RESOURCES = {
  auth: 'auth',
  game: 'game',
};

export const ENDPOINT = {
  auth: {
    index: `${RESOURCES.auth}`,
    login: `${RESOURCES.auth}/login`,
    validate: `${RESOURCES.auth}/validate`,
  },
  game: {
    play: `${RESOURCES.game}/play`,
  },
};
