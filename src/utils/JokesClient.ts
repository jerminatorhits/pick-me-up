import axios from 'axios';

const JOKE_URL = 'http://api.icndb.com/jokes/random';

export function getRandomJoke() {
  return axios.get(`${JOKE_URL}/jokes/random`);
}
