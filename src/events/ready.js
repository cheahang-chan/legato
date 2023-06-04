const db = require('../util/database/index.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.guilds.cache.forEach(async guild => {
            await guild.members.fetch();
            await guild.commands.set(client.commandData).then(console.log(`Added slash commands to ${guild.name} server`));
        });

        await db.init();

        const guildsInDb = await db.Guild.find().then(guilds => guilds.map(guild => guild.id));
        const guildsNotInDb = client.guilds.cache
            .filter(guild => !guildsInDb.includes(guild.id))
            .map(guild => Object.assign({ id: guild.id, name: guild.name }));

        if (guildsNotInDb.length) {
            await db.Guild.insertMany(guildsNotInDb)
                .then(result => console.log(`${result.length} guilds added to db.`))
                .catch(err => console.log(err));
        }

        client.user.setActivity('With Harry\'s ****');
        console.log('Bot is ready!');
        console.log(`Running ${client.commands.size} commands | Serving ${client.users.cache.size} users in ${client.guilds.cache.size} guilds`);
    },
};
