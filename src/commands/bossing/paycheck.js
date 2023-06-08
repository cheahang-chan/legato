const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../util/database/index.js');
const { Permissions } = require('discord.js');
const { getDropString } = require('../../util/common.js');

module.exports = {
    data: {
        name: 'paycheck',
        description: 'Check your or another player\'s paycheck.',
        options: [{
            name: 'list',
            description: 'View your paychecks.',
            type: 1,
            required: false,
        },
        {
            name: 'user',
            description: 'Input the user\'s paycheck you would like to view.',
            type: 1,
            required: false,
            options: [{
                name: 'user',
                description: 'Input the user here.',
                type: 6,
                required: true
            }]
        },
        {
            name: 'from',
            description: 'View paychecks you are owed by this person.',
            type: 1,
            options: [{
                name: 'user',
                description: 'Input the user here.',
                type: 6,
                required: true
            }]
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild, options } = interaction;
        const subcommand = options.getSubcommand();

        const Guild = await db.Guild.findOne({ id: guild.id });

        if (subcommand === 'user' || subcommand === 'list') {
            const user = options.getUser('user') ?? interaction.user;
            const Member = await db.Member.findOne({ guildId: guild.id, userId: user.id });

            if (!Member) return await interaction.reply({ embeds: [{ description: `${user ?? "You"} have not participated in a boss from this server yet.`, color: 'RED' }] });

            const drops = [];
            const multiplier = 5;
            let page = 1;
            let description = "";

            Member.paychecks.forEach(drop => {
                drops.push(getDropString(Guild, drop) + "\n");
            });

            const maxPages = drops.length % multiplier ? Math.floor(drops.length / multiplier) + 1 : drops.length / multiplier;

            for (let i = 0; i < multiplier; i++) {
                description += drops[i] ?? "";
            }

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor(`${user.username}'s Paycheck`, user.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 }))
                .setDescription(`**Pending Payments:**\n${drops.length ? description : 'No pending payments.'}`)
                .addField('Pending Total:', `${Member.payment.toLocaleString()} mesos`);

            if (drops.length > 5) {
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
                    if (i.customId === 'next' && (page + 1 * multiplier) < drops.length) {
                        page++;
                        index = (page - 1) * multiplier;
                    }
                    else if (i.customId === 'previous' && page - 1 > 0) {
                        page--;
                        index = (page - 1) * multiplier;
                    }
                    else return;

                    description = ""
                    for (let i = index; i < (page * multiplier); i++) {
                        description += drops[i] ?? "";
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
        } else if (subcommand === 'from') {
            const Member = await db.Member.findOne({ guildId: guild.id, userId: interaction.user.id });
            const user = options.getUser('user');
            const paychecks = [];
            const multiplier = 5;
            let page = 1;
            let totalPayment = 0;

            for (let i = 0; i < Member.paychecks.length; i++) {
                const paycheck = Member.paychecks[i];
                if (paycheck.sellerId === user.id) {
                    paychecks.push(paycheck);
                    totalPayment += paycheck.split;
                }
            }

            const maxPages = paychecks.length % multiplier ? Math.floor(paychecks.length / multiplier) + 1 : paychecks.length / multiplier;

            let description = "**Pending Payments:**\n";
            for (let i = 0; i < multiplier; i++) {
                if (paychecks[i]) {
                    description += getDropString(Guild, paychecks[i]) + "\n" ?? "";
                }
            }

            const embed = new MessageEmbed()
                .setColor('GREEN')
                .setAuthor(`${user.username} Owes You`, user.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 }))
                .setDescription(`${paychecks.length ? description : 'No pending payments.'}`)
                .addField('Pending Total:', `${totalPayment.toLocaleString()} mesos`);

            if (paychecks.length > 5) {
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
                    if (i.customId === 'next' && (page + 1 * maxPages) < dropCount) {
                        page++;
                        index = (page - 1) * maxPages;
                    }
                    else if (i.customId === 'previous' && page - 1 > 0) {
                        page--;
                        index = (page - 1) * maxPages;
                    }
                    else return;

                    description = "**Pending Payments:**\n"
                    for (let i = index; i < (page * MAX_COUNT); i++) {
                        if (paychecks[i]) {
                            description += getDropString(Guild, paychecks[i]) + "\n" ?? "";
                        }
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
    },
};
