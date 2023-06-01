import { Scorekeeper } from './Scorekeeper';

import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_KEY = process.env.DISCORD_GUILD_KEY;

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

const readyHandler = async (): Promise<void> => {
	if(!GUILD_KEY) {
		console.log('GUILD_KEY not initialized.');
		return;
	}

	const guild = client.guilds.cache.get(GUILD_KEY);

	if(!guild) {
		console.log(`Could not get guild from key ${GUILD_KEY}`);
		return
	}

	const scorekeeper = new Scorekeeper(guild);
	await scorekeeper.init();

	await scorekeeper.calculateScore();

	scorekeeper.saveScoreboard();
	console.log('\n\nReady!');
}

// When the client is ready, run this code (only once)
client.once('ready', readyHandler);

// Login to Discord with your client's token
client.login(TOKEN);