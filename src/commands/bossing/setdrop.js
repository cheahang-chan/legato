const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const db = require('../../util/database/index.js');
const bossList = require('../../util/bossing/bossList.json');

const BOSS_CHOICES = [{
    name: 'Chosen Serene',
    value: 'chosen serene',
}, {
    name: 'Black Mage',
    value: 'black mage',
}, {
    name: 'Hard Djunkel',
    value: 'hard djunkel',
}, {
    name: 'Hard Heretic Hilla',
    value: 'hard heretic hilla',
}, {
    name: 'Chaos Dusk',
    value: 'chaos dusk',
}, {
    name: 'Chaos Slime',
    value: 'chaos slime',
}, {
    name: 'Hard Will',
    value: 'hard will',
}, {
    name: 'Hard Lucid',
    value: 'hard lucid',
}, {
    name: 'Hard Damien',
    value: 'hard damien',
}, {
    name: 'Hard Lotus',
    value: 'hard lotus',
}];

module.exports = {
    data: {
        name: 'setdrop',
        description: 'Add a new boss drop.',
        options: [{
            name: 'party',
            description: 'Set with a pre-existing party.',
            type: 1,
            options: [{
                name: 'boss',
                description: 'Select which boss the drop was from.',
                type: 3,
                required: true,
                choices: BOSS_CHOICES,
            }, {
                name: 'item',
                description: 'Input the full name of the drop here.',
                type: 3,
                required: true,
            }, {
                name: 'role',
                description: 'Input the party role here.',
                type: 8,
                required: true,
            }],
        }, {
            name: 'manual',
            description: 'Set by manually adding members.',
            type: 1,
            options: [{
                name: 'boss',
                description: 'Select which boss the drop was from.',
                type: 3,
                required: true,
                choices: BOSS_CHOICES,
            }, {
                name: 'item',
                description: 'Input the full name of the drop here.',
                type: 3,
                required: true,
            }, {
                name: 'randoms',
                description: 'Select the number of people in the party that is NOT in this Discord server. (0 if none)',
                type: 4,
                required: true,
                choices: [{
                    name: 0,
                    value: 0,
                }, {
                    name: 1,
                    value: 1,
                }, {
                    name: 2,
                    value: 2,
                }, {
                    name: 3,
                    value: 3,
                }, {
                    name: 4,
                    value: 4,
                }, {
                    name: 5,
                    value: 5,
                }],
            }, {
                name: 'member-1',
                description: 'Input 1st member of the party.',
                type: 6,
                required: true,
            }, {
                name: 'member-2',
                description: 'Input 2nd member of the party.',
                type: 6,
                required: false,
            }, {
                name: 'member-3',
                description: 'Input 3nd member of the party.',
                type: 6,
                required: false,
            }, {
                name: 'member-4',
                description: 'Input 4th member of the party.',
                type: 6,
                required: false,
            }, {
                name: 'member-5',
                description: 'Input 5nd member of the party.',
                type: 6,
                required: false,
            }, {
                name: 'member-6',
                description: 'Input 6nd member of the party.',
                type: 6,
                required: false,

            }],
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild, options, channel, user } = interaction;
        const Guild = await db.Guild.findOne({ id: guild.id });

        if (!Guild.dropsChannelId) return await interaction.reply({ embeds: [{ description: 'This server does not have a `drops` channel yet. Please use the `setchannel` command to set it up.', color: 'YELLOW' }] });
        const dropsChannel = guild.channels.cache.get(Guild.dropsChannelId);
        if (!dropsChannel) return await interaction.reply({ embeds: [{ description: 'The `drops` channel does not exist or has been deleted. Please use the `setchannel` command to set it up again.', color: 'YELLOW' }] });

        const bossName = options.getString('boss');
        const itemName = options.getString('item');
        const boss = bossList[bossName];
        const members = []; // Stores Discord role members.
        let partySize = 0;
        let newDropId = Guild.dropCounter ? Guild.dropCounter + 1 : 1

        const embed = new MessageEmbed()
            .setColor(boss.color)
            .setAuthor(`Drop #${newDropId}`, boss.image)
            .setTitle(`Boss: ${boss.name}\nItem: ${itemName}`);
        const confirmEmbed = new MessageEmbed()
            .setDescription('You have `60 seconds` to upload, confirm, or cancel.\n\nClick the ✅ button to confirm the above information is correct.\nClick the 📸 button to upload an optional image of the drop.\n Click the ❌ button to cancel this action.');
        const row = new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setCustomId('confirm')
                    .setLabel('Confirm')
                    .setEmoji('✅')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('image')
                    .setLabel('Upload Image')
                    .setEmoji('📸')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setEmoji('❌')
                    .setStyle('DANGER'),
            ]);

        if (options.getSubcommand() === 'party') {
            const role = options.getRole('role');

            if (!Guild.verifyParty(role.id)) return await interaction.reply({ embeds: [{ description: `${role} is not a party role.`, color: 'RED' }] });

            role.members.each(member => members.push(member));
            partySize = members.length;

            if (members.length > 6) return await interaction.reply({ embeds: [{ description: `**Something is wrong**.\n${role} has over 6 members (${partySize}).\nPlease edit or recreate the party.`, color: 'YELLOW' }] });

            embed.addField(`Party: (size: ${partySize})`, `${members.sort((first, second) => first.id - second.id).join(', ')}`);
        }
        else {
            const randoms = options.getInteger('randoms');
            const party = [
                interaction.options.getMember('member-0'),
                interaction.options.getMember('member-1'),
                interaction.options.getMember('member-2'),
                interaction.options.getMember('member-3'),
                interaction.options.getMember('member-4'),
                interaction.options.getMember('member-5'),
                interaction.options.getMember('member-6'),
            ].filter(Boolean);
            party.forEach(member => members.push(member));
            partySize = members.length + randoms;

            if (partySize > 6) return await interaction.reply({ embeds: [{ description: `**Something is wrong**.\nYou included over has over 6 members, \`${members.length} users\` and \`${randoms} randoms\`.\nPlease recreate the party.`, color: 'YELLOW' }] });
            if ((new Set(members)).size !== members.length) return await interaction.reply({ embeds: [{ description: '**Something is wrong**.\nYou have entered a member more than once.\nPlease recreate the party.', color: 'YELLOW' }] });

            embed.addField(`Party: (size: ${partySize})`, `${members.sort((first, second) => first.id - second.id).join(', ')}${randoms ? `, + ${randoms} randoms` : ''}`);
        }

        const reply = await await interaction.reply({ embeds: [embed, confirmEmbed], components: [row], fetchReply: true });

        const buttonFilter = i => i.user.id === interaction.user.id && ['confirm', 'image', 'cancel'].includes(i.customId);
        const buttonCollector = reply.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });
        const msgFilter = m => m.author.id === interaction.user.id;
        const msgCollector = channel.createMessageCollector({ filter: msgFilter, max: 1 });

        buttonCollector.on('collect', async i => {
            await i.deferUpdate();
            const button = i.customId;

            if (button === 'confirm') {
                buttonCollector.stop();

                const drop = {
                    sellerId: user.id,
                    guildId: guild.id,
                    number: newDropId,
                    dropMessageId: '',
                    saleMessageId: '',
                    boss: boss.name,
                    item: itemName,
                    partySize,
                    party: [],
                    price: 0,
                    sold: false,
                };

                const Members = []; // Stores database Members.
                const Drop = await db.Drop.create(drop);
                await Guild.updateOne({ $inc: { dropCounter: 1 }, $push: { drops: Drop } });

                for (const member of members) {
                    const Member = await db.Member.findOne({ guildId: guild.id, userId: member.id });
                    if (!Member) {
                        const Member = await db.Member.create({ guildId: guild.id, userId: member.id, name: member.user.username, drops: Drop });
                        Members.push(Member);
                    }
                    else {
                        await Member.updateOne({ $push: { drops: Drop } });
                        Members.push(Member);
                    }
                }

                const image = await interaction.fetchReply().then(reply => {
                    return reply.embeds[0].image ? reply.embeds[0].image.url : null;
                });

                if (image) embed.setImage('attachment://screenshot.png');

                const dropMessage = image ? await dropsChannel.send({ embeds: [embed], files: [{ attachment: image, name: 'screenshot.png' }] }) : await dropsChannel.send({ embeds: [embed] });
                await Drop.updateOne({ dropMessageId: dropMessage.id, $push: { party: Members } });
                return await interaction.editReply({ embeds: [embed, { description: `Sucessfully created a new [drop](${dropMessage.url}).`, color: 'GREEN' }], components: [] });
            }
            else if (button === 'image') {
                const row = new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setCustomId('confirm')
                            .setLabel('Confirm')
                            .setEmoji('✅')
                            .setStyle('SUCCESS')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('image')
                            .setLabel('Upload Image')
                            .setEmoji('📸')
                            .setStyle('PRIMARY')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('cancel')
                            .setLabel('Cancel')
                            .setEmoji('❌')
                            .setStyle('DANGER'),
                    ]);

                await interaction.editReply({ embeds: [embed, confirmEmbed], components: [row] });

                const msg = await channel.send({ embeds: [{ description: 'Please upload the image now.\nIt can be either an image file or a image link ending in `.png`, `.jpg`, or `.jpeg`' }] });

                msgCollector.on('collect', async m => {
                    m.delete();
                    const row = new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setCustomId('confirm')
                                .setLabel('Confirm')
                                .setEmoji('✅')
                                .setStyle('SUCCESS'),
                            new MessageButton()
                                .setCustomId('image')
                                .setLabel('Upload Image')
                                .setEmoji('📸')
                                .setStyle('PRIMARY')
                                .setDisabled(true),
                            new MessageButton()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setEmoji('❌')
                                .setStyle('DANGER'),
                        ]);

                    if (m.attachments.size) {
                        embed.setImage('attachment://screenshot.png');
                        await interaction.editReply({ embeds: [embed, confirmEmbed], components: [row], files: [{ attachment: m.attachments.first().url, name: 'screenshot.png' }] });
                    }
                    else if (m.content.endsWith('.png') || m.content.endsWith('.jpg') || m.content.endsWith('.jpeg')) {
                        embed.setImage(m.content);
                        await interaction.editReply({ embeds: [embed, confirmEmbed], components: [row] });
                    }
                    else return;
                });

                msgCollector.on('end', () => {
                    msg.delete();
                });
            }
            else {
                buttonCollector.stop();
                msgCollector.stop();
                return await interaction.editReply({ embeds: [embed, { description: 'Aborted!', color: 'RED' }], components: [] });
            }
        });
    },
};
