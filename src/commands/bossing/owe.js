const { Collection, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../util/database/index.js');
const { Permissions } = require('discord.js');
const { getDropString } = require('../../util/common.js');

module.exports = {
    data: {
        name: 'owe',
        description: 'O$P$',
        options: [{
            name: 'list',
            description: 'View how much you owe everyone in the server.',
            type: 1,
        },
        {
            name: 'user',
            description: 'View how much this user owes you.',
            type: 1,
            options: [{
                name: 'name',
                description: 'Input the discord tag of the user',
                type: 6,
                required: true,
            }],
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild, options, channel, user } = interaction;
        const Guild = await db.Guild.findOne({ id: guild.id });
        const Member = await db.Member.findOne({ guildId: guild.id, userId: user.id });

        if (options.getSubcommand() === 'list') {
            const Members = await db.Member.find({ guildId: guild.id, paychecks: { $ne: [] } });
            const members = new Collection();
            const description = [];
            const multiplier = 5;
            let page = 1;
            let total = 0;

            for (const member of Members) {
                let memberTotalPayment = 0;

                const paychecksOwed = member.paychecks.map(drop => {
                    const drops = [];
                    if (drop.sellerId === Member.userId) {
                        memberTotalPayment += drop.split;
                        drops.push(getDropString(Guild.id, Guild.salesMessageId, drop))
                    }
                    return drops;
                });

                if (memberTotalPayment) {
                    members.set(member.userId, {
                        id: member.userId,
                        payments: paychecksOwed,
                        total: `Total: ${memberTotalPayment} mesos`
                    });
                    total += memberTotalPayment;
                }
            }
            
            const maxPages = members.length % multiplier ? Math.floor(members.length / multiplier) + 1 : members.length / multiplier;

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
        } else if (options.getSubcommand() === 'user') {
            const name = options.getUser('name');
            const drops = [];

            let totalPayment = 0;

            for (let i = 0; i < Member.paychecks.length; i++) {
                const Drop = await db.Drop.findById(Member.paychecks[i].id);

                if (Drop.sellerId === name.id) {
                    totalPayment += Drop.split;
                    drops.push(getDropString(Guild.id, Guild.salesMessageId, Drop))
                }
            }

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor(`${name.username} Owes Me`, name.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 }))
                .addField('Pending Payments:', `${drops.length ? drops.join('\n') : 'No pending payments.'}`)
                .addField('Pending Total:', `${totalPayment.toLocaleString()} mesos`);

            return await interaction.reply({ embeds: [embed] });
        }
    }
};
