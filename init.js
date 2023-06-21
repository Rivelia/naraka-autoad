import { exchangeCode } from '@twurple/auth';
import config from 'config';

const clientId = config.get('twitch.client_id');
const clientSecret = config.get('twitch.client_secret');

const code = 'YOUR_TWITCH_CODE_HERE'; // get it from wherever
const redirectUri = 'http://localhost'; // must match one of the URLs in the dev console exactly
const tokenData = await exchangeCode(clientId, clientSecret, code, redirectUri);

console.log(tokenData);
