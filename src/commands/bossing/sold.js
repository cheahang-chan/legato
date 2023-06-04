const { MessageActionRow, MessageButton, MessageEmbed, Permissions } = require('discord.js');
const db = require('../../util/database/index.js');
const bossList = require('../../util/bossing/bossList.json');

module.exports = {
    data: {
        name: 'sold',
        description: 'Mark an item drop as sold.',
        options: [{
            name: 'drop',
            description: 'Input the Drop ID here.',
            type: 4,
            required: true,
        }, {
            name: 'price',
            description: 'Input the price the drop was sold for.',
            type: 4,
            required: true,
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild, options, channel } = interaction;
        const Guild = await db.Guild.findOne({ id: guild.id });
        if (!Guild.salesChannelId) return await interaction.reply({ embeds: [{ description: 'This server does not have a `sales` channel set up yet. Please use the `setchannel` command to set it up', color: 'YELLOW' }] });
        const salesChannel = guild.channels.cache.get(Guild.salesChannelId);
        if (!salesChannel) return await interaction.reply({ embeds: [{ description: 'The `sales` channel does not exist or has been deleted. Please use the `setchannel` command to set it up', color: 'RED' }] });

        const dropNumber = options.getInteger('drop');
        const price = options.getInteger('price');
        const Drop = await db.Drop.findOne({ guildId: guild.id, number: dropNumber });

        if (!Drop) return await interaction.reply({ embeds: [{ description: `Drop \`${dropNumber}\` does not exist.`, color: 'RED' }] });
        if (Drop.sold) return await interaction.reply({ embeds: [{ description: `Drop \`${dropNumber}\` has already been marked as sold`, color: 'YELLOW' }] });
        if (price < 0) return await interaction.reply({ embeds: [{ description: 'You cannot input a negative price', color: 'RED' }] });

        const boss = bossList[Drop.boss.toLowerCase()];
        const dropsChannel = guild.channels.cache.get(Guild.dropsChannelId);
        const dropMsg = await dropsChannel.messages.fetch(Drop.dropMessageId);
        const dropEmbed = dropMsg.embeds[0];
        Drop.price = price;

        const saleEmbed = new MessageEmbed()
            .setColor('GREEN')
            .setAuthor(`Drop #${Drop.number}`, boss.image)
            .setTitle(`Boss: ${boss.name}\nItem: ${Drop.item}`)
            .setDescription(`[View Drop](${dropMsg.url})`)
            .addField('Sold for:', `${Drop.price.toLocaleString()} mesos`, true)
            .addField('After 5% tax:', `${Drop.taxed.toLocaleString()} mesos`, true)
            .addField(`Split: (${Drop.partySize})`, `${Drop.split.toLocaleString()} mesos`);
        if (Drop.image) saleEmbed.setImage(item.image);

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

        const reply = await await interaction.reply({ embeds: [saleEmbed, confirmEmbed], components: [row], fetchReply: true });

        const buttonFilter = i => i.user.id === interaction.user.id && ['confirm', 'image', 'cancel'].includes(i.customId);
        const buttonCollector = reply.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });
        const msgFilter = m => m.author.id === interaction.user.id;
        const msgCollector = channel.createMessageCollector({ filter: msgFilter, max: 1 });

        buttonCollector.on('collect', async i => {
            await i.deferUpdate();
            const button = i.customId;

            if (button === 'confirm') {
                buttonCollector.stop();

                const partyMembers = [];

                Drop.party.forEach(async member => {
                    partyMembers.push(`<@!${member.userId}>`);
                    await member.updateOne({ $push: { paychecks: Drop } });
                });

                const image = await interaction.fetchReply().then(reply => {
                    return reply.embeds[0].image ? reply.embeds[0].image.url : null;
                });

                if (image) saleEmbed.setImage('attachment://screenshot.png');

                const saleMessage = image ? await salesChannel.send({ content: partyMembers.sort().join(', '), embeds: [saleEmbed], files: [{ attachment: image, name: 'screenshot.png' }] }) : await salesChannel.send({ content: partyMembers.sort().join(', '), embeds: [saleEmbed] });

                dropEmbed.setImage('attachment://screenshot.png')
                    .setDescription(`Sales Receipt: [Here](${saleMessage.url} 'View Sales Receipt')`)
                    .setFooter(`Sold for: ${price.toLocaleString()}`);
                dropMsg.edit({ embeds: [dropEmbed] });
                await dropMsg.react('💰');

                await Drop.updateOne({ saleMessageId: saleMessage.id, price, sold: true });
                return await interaction.editReply({ embeds: [saleEmbed, { description: `[Drop #${Drop.number}](${dropMsg.url} 'View Drop') has been sucessfully marked as [sold](${saleMessage.url} 'View Sales Receipt').`, color: 'GREEN' }], components: [] });
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
                await interaction.editReply({ embeds: [saleEmbed, confirmEmbed], components: [row] });

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
                        saleEmbed.setImage('attachment://screenshot.png');
                        await interaction.editReply({ embeds: [saleEmbed, confirmEmbed], components: [row], files: [{ attachment: m.attachments.first().url, name: 'screenshot.png' }] });
                    }
                    else if (m.content.endsWith('.png') || m.content.endsWith('.jpg') || m.content.endsWith('.jpeg')) {
                        saleEmbed.setImage(m.content);
                        await interaction.editReply({ embeds: [saleEmbed, confirmEmbed], components: [row] });
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
                return await interaction.editReply({ embeds: [saleEmbed, { description: 'Aborted!', color: 'RED' }], components: [] });
            }
        });
    },
};
