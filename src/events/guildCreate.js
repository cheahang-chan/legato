const db = require('../util/database/index.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        console.log(`Bot has joined ${guild.name} server`);
        await guild.commands.set(client.commandData).then(console.log(`Added slash commands to ${guild.name} server`));

        const Guild = await db.Guild.findOne({ id: guild.id });

        if (Guild) {
            return;
        }
        else {
            db.Guild.create({ id: guild.id, name: guild.name });
            return console.log(`${guild.name} added into database.`);
        }
    },
};
