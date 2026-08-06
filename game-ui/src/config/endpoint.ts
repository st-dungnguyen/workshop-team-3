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
    eligibility: `${RESOURCES.game}/eligibility`,
    play: `${RESOURCES.game}/play`,
  },
};
