const { Permissions } = require('discord.js');
const db = require('../../util/database/index.js');

module.exports = {
    data: {
        name: 'setchannel',
        description: 'Set a text channel for the bot to post stuff in.',
        options: [{
            name: 'type',
            description: 'Select which type of channel you would like to set. (Drops | Sales | Paychecks)',
            type: 3,
            required: true,
            choices: [{
                name: 'Drops',
                value: 'drops',
            }, {
                name: 'Sales',
                value: 'sales',
            }, {
                name: 'Paychecks',
                value: 'paychecks',
            }],
        }, {
            name: 'channel',
            description: 'Input the text channel you would like to set to.',
            type: 7,
            required: true,
        }],
    },
    permissions: [Permissions.FLAGS.ADMINISTRATOR],
    async execute(interaction) {
        const Guild = await db.Guild.findOne({ id: interaction.guild.id });
        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 'GUILD_TEXT') return await interaction.reply({ embeds: [{ description: 'You may only use `Text Channels`.', color: 'RED' }] });

        if (type === 'drops') {
            await Guild.updateOne({ $set: { dropsChannelId: channel.id } });
            return await interaction.reply({ embeds: [{ description: `The \`drops\` channel has been sucessfully set to ${channel}` }] });
        }
        else if (type === 'sales') {
            await Guild.updateOne({ $set: { salesChannelId: channel.id } });
            return await interaction.reply({ embeds: [{ description: `The \`Sales\` channel has been sucessfully set to ${channel}` }] });
        }
        else {
            await Guild.updateOne({ $set: { paychecksChannelId: channel.id } });
            return await interaction.reply({ embeds: [{ description: `The \`paychecks\` channel has been sucessfully set to ${channel}` }] });
        }
    },
};
