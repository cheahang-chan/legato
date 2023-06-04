const { Collection, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../util/database/index.js');
const { meso } = require('../../util/emoji.json');
const { Permissions } = require('discord.js');

module.exports = {
    data: {
        name: 'paychecks',
        description: 'View all of the paychecks in the server.',
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild } = interaction;

        const Guild = await db.Guild.findOne({ id: guild.id });
        const Members = await db.Member.find({ guildId: guild.id, paychecks: { $ne: [] } });
        const members = new Collection();
        const description = [];
        const multiplier = 5;
        const maxPages = Members.length % multiplier ? Math.floor(Members.length / multiplier) + 1 : Members.length / multiplier;
        let page = 1;
        let total = 0;

        for (const Member of Members) {
            members.set(Member.userId, { id: Member.userId, payments: `Drops: ${Member.paychecks.map(paycheck => `[#${paycheck.number} - ${paycheck.item} (${paycheck.boss})](https://discord.com/channels/${Guild.id}/${Guild.salesChannelId}/${paycheck.saleMessageId})`).join(', ')}`, total: `Total: ${Member.payment.toLocaleString()} mesos` });
            total += Member.payment;
        }

        const fields = members
            .sort((a, b) => a.id - b.id)
            .first(multiplier);

        fields.forEach(field => {
            description.push(`<@!${field.id}>:\n${field.payments}\n${field.total}`);
        });

        const embed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle('All Paychecks')
            .setDescription(description.join('\n\n') + `\n\n\n__Total Mesos__: ${total.toLocaleString()} mesos`);

        if (maxPages > 1) {
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
                const description = [];
                if (i.customId === 'next' && page < maxPages) {
                    page++;
                }
                else if (i.customId === 'previous' && page > 1) {
                    page--;
                }
                else return;

                const fields = members
                    .sort((a, b) => a.id - b.id)
                    .first(page * multiplier)
                    .filter((member, position) => position >= (page - 1) * multiplier && position < page * multiplier);

                fields.forEach(field => {
                    description.push(`<@!${field.id}>:\n${field.payments}\n${field.total}`);
                });

                const embed = new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle('All Paychecks')
                    .setDescription(description.join('\n\n') + `\n\n\n__total__: ${total.toLocaleString()} mesos`)
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
    },
};
