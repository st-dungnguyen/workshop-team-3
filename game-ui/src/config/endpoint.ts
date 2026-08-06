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
    config: `${RESOURCES.game}/config`,
    eligibility: `${RESOURCES.game}/eligibility`,
    play: `${RESOURCES.game}/play`,
    claim: `${RESOURCES.game}/claim`,
  },
};
