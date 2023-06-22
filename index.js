#!/usr/bin/env node
import { RefreshingAuthProvider } from '@twurple/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { Tail } from 'tail';
import { ApiClient } from '@twurple/api';
import OBSWebSocket from 'obs-websocket-js';
import config from 'config';

// Game State Constants
const GAME_STATE_LOBBY = 0;
const GAME_STATE_BATTLE_LOBBY = 1;
const GAME_STATE_BATTLE = 2;

// Twitch API config
const twitchEnabled = config.get('twitch.enable');
console.info(`Twitch integration is ${twitchEnabled ? 'enabled' : 'disabled'}`);
const clientId = config.get('twitch.client_id');
const clientSecret = config.get('twitch.client_secret');
const userId = +config.get('twitch.user_id');
const commercialSeconds = +config.get('twitch.commercial_time_seconds');

// OBS Config
const obsEnabled = config.get('obs.enable');
console.info(`OBS integration is ${obsEnabled ? 'enabled' : 'disabled'}`);

// Path to log file to watch for game state changes
const logPath = path.join(
	process.env.APPDATA,
	'../LocalLow/24Entertainment/Naraka/Player.log'
);

(async () => {
	// Init Twitch Integration
	let twitch = null;
	if (twitchEnabled) {
		// Read last Twitch token
		const tokenData = JSON.parse(
			await fs.readFile(`./tokens.${userId}.json`, 'UTF-8')
		);

		// Authenticate to Twitch API and refresh token if necessary
		const authProvider = new RefreshingAuthProvider({
			clientId,
			clientSecret,
			onRefresh: async (userId, newTokenData) =>
				await fs.writeFile(
					`./tokens.${userId}.json`,
					JSON.stringify(newTokenData, null, 4),
					'UTF-8'
				),
		});
		await authProvider.addUserForToken(tokenData);
		twitch = new ApiClient({ authProvider });
	}

	// Init OBS Integration
	let obs = new OBSWebSocket();
	let isObsConnected = false;

	const obsUrl = config.get('obs.websocket_url');
	const obsPassword = config.get('obs.password');
	async function obsConnect() {
		try {
			const { obsWebSocketVersion, negotiatedRpcVersion } =
				await obs.connect(obsUrl, obsPassword);
			console.log(
				`OBS Integration: connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`
			);
			isObsConnected = true;
		} catch (error) {
			console.error(
				'OBS Integration: failed to connect',
				error.code,
				error.message
			);
			console.info('OBS Integration: retrying in 5s.');
			setTimeout(obsConnect, 5000);
		}
	}

	if (obsEnabled) {
		obsConnect();
	}

	async function switchScene(sceneName) {
		if (!obsEnabled) {
			return;
		}
		if (!isObsConnected) {
			console.warn(
				'OBS Integration: OBS not connected yet, unable to switch scene.'
			);
			return;
		}
		console.info(`OBS Integration: switching to OBS Scene "${sceneName}"`);
		try {
			await obs.call('SetCurrentProgramScene', { sceneName });
		} catch (error) {
			console.error(
				'OBS Integration: failed to switch scene. Is OBS running? Does the scene exist?'
			);
		}
	}

	let gameState = GAME_STATE_LOBBY;
	let lastGameStateChange = 0;

	// Init log file watch
	const tail = new Tail(logPath, { useWatchFile: true, fromBeginning: true });
	tail.on('line', (line) => {
		if (line.includes('vivox OnEnterLobby')) {
			if (gameState === GAME_STATE_LOBBY) {
				return;
			}
			gameState = GAME_STATE_LOBBY;
			lastGameStateChange = Date.now();
			console.info('Game State: Lobby');
			switchScene(config.get('obs.lobby_scene'));
		} else if (line.includes('vivox OnEnterBattle')) {
			if (gameState === GAME_STATE_BATTLE_LOBBY) {
				return;
			}
			gameState = GAME_STATE_BATTLE_LOBBY;
			lastGameStateChange = Date.now();
			console.info('Game State: Battle Lobby');
			switchScene(config.get('obs.battle_lobby_scene'));
		} else if (line.includes('DoHideTeamOffLoadingPage')) {
			if (gameState === GAME_STATE_BATTLE) {
				return;
			}
			gameState = GAME_STATE_BATTLE;
			lastGameStateChange = Date.now();
			console.info('Game State: Battle');
			switchScene(config.get('obs.battle_scene'));
		}
	});

	tail.on('error', function (error) {
		console.error('ERROR while attempting to read game state: ', error);
	});

	// Twitch Integration Loop
	if (twitchEnabled) {
		let lastCommercial = 0;
		async function twitchLoop() {
			if (
				gameState !== GAME_STATE_LOBBY ||
				Date.now() - lastCommercial < 900000 // 15 minutes
			) {
				setTimeout(twitchLoop, 1000);
				return;
			}

			const stream = await twitch.streams.getStreamByUserId(userId);
			if (stream === null) {
				console.info(
					'Twitch Integration: not streaming, waiting 1 minute.'
				);
				setTimeout(twitchLoop, 60000);
				return;
			}

			console.info(
				`Twitch Integration: stream is live, starting ${commercialSeconds}s commercial.`
			);

			try {
				await twitch.channels.startChannelCommercial(
					userId,
					commercialSeconds
				);
				console.info(
					`Twitch Integration: started ${commercialSeconds}s commercial.`
				);
			} catch (error) {
				console.error(
					'Twitch Integration: failed to start commercial. Is a commercial running already?'
				);
			}

			lastCommercial = Date.now();
			setTimeout(twitchLoop, 1000);
		}
		twitchLoop();
	}
})();
