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
            options: [{
                name: 'user',
                description: 'Input the user here.',
                type: 6,
                required: false
            }]
        }, {
            name: 'user',
            description: 'View how much you owe this person.',
            type: 1,
            options: [{
                name: 'user',
                description: 'Input the user here.',
                type: 6,
                required: false
            }]
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild, options } = interaction;
        const subcommand = options.getSubcommand();
        const currentUser = interaction.user;
        const targetUser = options.getUser('user');
        const Guild = await db.Guild.findOne({ id: guild.id });

        if (subcommand === "list") {
            const user = targetUser ?? currentUser;
            const Member = await db.Member.findOne({ guildId: guild.id, userId: user.id });
            const Members = await db.Member.find({ guildId: guild.id, paychecks: { $ne: [] } });
            const members = new Collection();
            const description = [];
            const multiplier = 3;
            let page = 1;
            let total = 0;

            for (let i = 0; i < Members.length; i++) {
                const member = Members[i];
                let memberTotalPayment = 0;

                const paychecksOwed = member.paychecks.map(drop => {
                    const drops = [];
                    if (drop.sellerId === Member.userId) {
                        memberTotalPayment += drop.split;
                        drops.push(getDropString(Guild, drop))
                    }
                    return drops;
                });

                if (memberTotalPayment) {
                    members.set(member.userId, {
                        id: member.userId,
                        payments: paychecksOwed.join(""),
                        total: `Total: ${memberTotalPayment.toLocaleString()} mesos`
                    });
                    total += memberTotalPayment;
                }
            }

            const maxPages = members.size % multiplier ? Math.floor(members.size / multiplier) + 1 : members.size / multiplier;

            const fields = members
                .sort((a, b) => a.id - b.id)
                .first(multiplier);

            // field 1 member
            fields.forEach(field => {
                description.push(`<@!${field.id}>:\n${field.payments}\n${field.total}`);
            });

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor(`${user.username} Owes:`, user.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 }))
                .setDescription(description.join('\n\n') + `\n\n\n__Grand Total__: ${total.toLocaleString()} mesos`);

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
                        .setAuthor(`${user.username}'s Paycheck`, user.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 }))
                        .setDescription(description.join('\n\n') + `\n\n\n__Grand Total__: ${total.toLocaleString()} mesos`)
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
        } else if (subcommand === "user") {
            const Member = await db.Member.findOne({ guildId: guild.id, userId: targetUser.id });
            let total = 0;

            const paychecksOwed = Member.paychecks.map(drop => {
                const drops = [];
                if (drop.sellerId === currentUser.id) {
                    total += drop.split;
                    drops.push(getDropString(Guild, drop))
                }
                return drops;
            });

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor(`You Owe ${targetUser.username}:`, targetUser.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 }))
                .setDescription(paychecksOwed.join("") + `\n__Grand Total__: ${total.toLocaleString()} mesos`);

            return await interaction.reply({ embeds: [embed] });
        }
    }
};
