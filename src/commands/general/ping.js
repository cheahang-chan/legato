const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');

module.exports = {
    data: {
        name: 'ping',
        description: 'Returns the bot\'s response time.',
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction, client) {
        const msg = await interaction.deferReply({ fetchReply: true });

        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setDescription(`Bot Ping: **${msg.createdTimestamp - interaction.createdTimestamp}** ms\nAPI Ping: **${client.ws.ping}** ms`);

        await interaction.editReply({ embeds: [embed] });
    },
};
