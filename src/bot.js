require('dotenv').config();
const { Client, Collection, Intents } = require('discord.js');
const eventHandler = require('./handlers/eventHandler.js');
const commandHandler = require('./handlers/commandHandler.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });
client.commands = new Collection();
client.commandData = [];

eventHandler(client);
commandHandler(client);

console.log("Environments Loaded.. " + JSON.stringify(process.env))
console.log("Connecting to Discord.. Token: " + process.env.DISCORD_BOT_TOKEN)
client.login(process.env.DISCORD_BOT_TOKEN);
