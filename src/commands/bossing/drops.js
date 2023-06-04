const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../util/database/index.js');
const { Permissions } = require('discord.js');

const MAX_COUNT = 5;

module.exports = {
    data: {
        name: 'drops',
        description: 'Views all of the drops in the server.',
        options: [{
            name: 'all',
            description: 'Shows all existing drops, including sold items in the server.',
            type: 1,
        },
        {
            name: 'list',
            description: 'Shows all existing unsold drops in the server.',
            type: 1,
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild } = interaction;
        const subcommand = interaction.options.getSubcommand();
        const Guild = await db.Guild.findOne({ id: guild.id });

        let Drops = null;
        if (subcommand === 'list') {
            Drops = await db.Drop.find({ guildId: guild.id, saleMessageId: { $eq: "" } });
        } else if (subcommand === 'all') {
            Drops = await db.Drop.find({ guildId: guild.id });
        }

        const dropsArray = [];
        const dropCount = Drops.length;
        const maxPages = Math.ceil(dropCount / MAX_COUNT);
        let index = 0;
        let page = 1;

        Drops.forEach(drop => {
            const members = drop.party.sort((first, second) => first.id - second.id).map(member => `<@${member.userId}>`);
            const dropMessageUrl = `https://discord.com/channels/${Guild.id}/${Guild.dropsChannelId}/${drop.dropMessageId}`;
            const salesMessageUrl = `https://discord.com/channels/${Guild.id}/${Guild.salesChannelId}/${drop.saleMessageId}`;
            dropsArray.push(`**Drop ID:** ${drop.number}\n**Boss:** ${drop.boss}\n**Item:** ${drop.item}\n**Status:** ${drop.saleMessageId ? `[Sold](${salesMessageUrl})` : `[Unsold](${dropMessageUrl})`}\n\n**Members:**\n${members.join(', ')}\n\n\n`);
        });

        let description = "";
        for (let i = 0; i < MAX_COUNT; i++) {
            description += dropsArray[i] ?? "";
        }

        const embed = new MessageEmbed()
            .setDescription(description);

        if (dropCount > 5) {
            embed.setFooter(`Page: ${page}/${maxPages}`);

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
                if (i.customId === 'next' && (page + 1 * MAX_COUNT) < dropCount) {
                    page++;
                    index = (page - 1) * MAX_COUNT;
                }
                else if (i.customId === 'previous' && page - 1 > 0) {
                    page--;
                    index = (page - 1) * MAX_COUNT;
                }
                else return;

                description = ""
                for (let i = index; i < (page * MAX_COUNT); i++) {
                    description += dropsArray[i] ?? "";
                }

                embed.setDescription(description)
                    .setFooter(`Page: ${page}/${maxPages}`);

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
};
