const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');

module.exports = {
    data: {
        name: 'guide',
        description: 'This is a guide.',
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const text = [
            '1. Use the `setchannel` command to set dedicated channels for the bot to post stuff in. Can be all the same or diff channels.',
            '2. Use the `party` command to create/delete/edit parties.',
            '3. Use the `setdrop` command to create your drops.',
            '4. Use the `sold` command to mark a drop as sold.',
            '5. Use the `paid` command to mark a user as paid for their split.',
            '6. Use the `paycheck/paychecks` command to view peoples paychecks.',
        ];
        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('Guide')
            .setDescription(text.join('\n'))
            .setFooter('Each command should be pretty self explanatory.');

        return await interaction.reply({ embeds: [embed] });
    },
};
