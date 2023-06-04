const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../util/database/index.js');
const { Permissions } = require('discord.js');

module.exports = {
    data: {
        name: 'parties',
        description: 'Views one or all of the parties in the server.',
        options: [{
            name: 'list',
            description: 'Shows all existing parties.',
            type: 1,
        }, {
            name: 'get',
            description: 'Shows one specific party.',
            type: 1,
            options: [{
                name: 'role',
                description: 'Input the party role here.',
                type: 8,
                required: true,
            }],
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild } = interaction;
        const subcommand = interaction.options.getSubcommand();
        const Guild = await db.Guild.findOne({ id: guild.id });

        if (subcommand === 'list') {
            const roleIds = Guild.parties;
            const roles = await guild.roles.fetch().then(roles => roles.filter(role => roleIds.includes(role.id)).sort((first, second) => first.name - second.name));
            const maxPages = roles.size;
            let index = 0;
            const description = [];

            roles.each(role => {
                const members = role.members.map(member => member).sort((first, second) => first.id - second.id);
                description.push(`**Party:** ${role}\n\n**Members:**\n${members.join(', ')}`);
            });

            const embed = new MessageEmbed()
                .setDescription(description[0]);

            if (maxPages > 1) {
                embed.setFooter(`Parties: 1/${maxPages}`);
                const row = new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setCustomId('previous')
                            .setEmoji('⬅️')
                            .setStyle('SECONDARY'),
                        new MessageButton()
                            .setCustomId('next')
                            .setEmoji('➡️')
                            .setStyle('SECONDARY'),
                    ]);
                const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
                const filter = async i => {
                    await i.deferUpdate();
                    return i.customId === 'previous' || i.customId === 'next';
                };
                const collector = reply.createMessageComponentCollector({ filter, componentType: 'BUTTON', idle: 15000, dispose: true });
                collector.on('collect', async i => {
                    if (i.customId === 'next' && index + 1 < maxPages) {
                        index++;
                    }
                    else if (i.customId === 'previous' && index + 1 > 1) {
                        index--;
                    }
                    else return;

                    embed.setDescription(description[index])
                        .setFooter(`Parties: ${index + 1}/${maxPages}`);


                    await interaction.editReply({ embeds: [embed], components: [row] });
                });

                collector.on('end', async () => {
                    await interaction.editReply({ components: [] });
                });
            }
            else {
                return await interaction.reply({ embeds: [embed] });
            }
        }
        else if (subcommand === 'get') {
            const role = interaction.options.getRole('role');
            const members = role.members.map(member => member).sort((first, second) => first.id - second.id);

            if (!Guild.verifyParty(role.id)) return await interaction.reply({ embeds: [{ description: `${role} is not a party role.`, color: 'RED' }] });

            const embed = new MessageEmbed()
                .setColor(role.color)
                .setTitle(`Party name: ${role.name}`)
                .setDescription(`**Members:**\n${members.join(', ')}`)
                .setFooter(`Size: ${members.length}`);

            return await interaction.reply({ embeds: [embed] });
        }
    },
};
