const { Permissions } = require('discord.js');
const db = require('../../util/database');

module.exports = {
    data: {
        name: 'paid',
        description: 'Mark payments for a user.',
        options: [{
            name: 'single',
            description: 'Mark a single paycheck.',
            type: 1,
            options: [{
                name: 'user',
                description: 'Input the user getting paid here.',
                type: 6,
                required: true,
            }, {
                name: 'drop',
                description: 'Input the drop # here.',
                type: 4,
                required: true,
            }],
        }, {
            name: 'multiple',
            description: 'Mark multiple paychecks. (Up to 10 at a time)',
            type: 1,
            options: [{
                name: 'user',
                description: 'Input the user getting paid here.',
                type: 6,
                required: true,
            }, {
                name: 'drop-1',
                description: 'Input the 1st drop # here.',
                type: 4,
                required: true,
            }, {
                name: 'drop-2',
                description: 'Input the 2nd drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-3',
                description: 'Input the 3rd drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-4',
                description: 'Input the 4th drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-5',
                description: 'Input the 5th drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-6',
                description: 'Input the 6th drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-7',
                description: 'Input the 7th drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-8',
                description: 'Input the 8th drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-9',
                description: 'Input the 9th drop # here.',
                type: 4,
                required: false,
            }, {
                name: 'drop-10',
                description: 'Input the 10th drop # here.',
                type: 4,
                required: false,
            }],
        }, {
            name: 'all',
            description: 'Mark all paychecks.',
            type: 1,
            options: [{
                name: 'user',
                description: 'Input the user getting paid here.',
                type: 6,
                required: true,
            }],
        }],
    },
    permissions: [Permissions.FLAGS.SEND_MESSAGES],
    async execute(interaction) {
        const { guild, options } = interaction;
        const subcommand = options.getSubcommand();
        const user = options.getUser('user');
        const Member = await db.Member.findOne({ guildId: guild.id, userId: user.id });

        if (!Member) return await interaction.reply({ embeds: [{ description: `${user} have not participated in a boss from this server yet.`, color: 'RED' }] });

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'single') {
            const dropNumber = options.getInteger('drop');
            const Drop = await db.Drop.findOne({ guildId: guild.id, number: dropNumber });

            if (!Drop) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `Drop \`#${dropNumber}\` does not exist.`, color: 'RED' }] });

            if (!Member.verifyDrop(Drop)) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `${user} was not part of Drop \`#${dropNumber}\`'s split.`, color: 'RED' }] });

            if (!Drop.sold) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `Drop \`#${dropNumber}\` has not been sold yet.`, color: 'RED' }] });

            if (!Member.verifyPaycheck(Drop)) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `${user} has already been paid for Drop \`#${dropNumber}\`.`, color: 'RED' }] });

            await Member.updateOne({ $pull: { paychecks: Drop.id } });

            return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `Successfully marked Drop \`#${dropNumber}\` as paid for ${user}.`, color: 'GREEN' }] });
        }
        else if (subcommand === 'multiple' || subcommand === 'all') {
            let dropNumbers = [];
            const Drops = [];
            const dne = [];
            const excluded = [];
            const unsold = [];
            const paid = [];
            const drops = [];
            const text = [];

            if (subcommand === 'multiple') {
                dropNumbers = [
                    options.getInteger('drop-1'),
                    options.getInteger('drop-2'),
                    options.getInteger('drop-3'),
                    options.getInteger('drop-4'),
                    options.getInteger('drop-5'),
                    options.getInteger('drop-6'),
                    options.getInteger('drop-7'),
                    options.getInteger('drop-8'),
                    options.getInteger('drop-9'),
                    options.getInteger('drop-10'),
                ].filter(Boolean).sort((a, b) => a - b);
            } else {
                dropNumbers = (await db.Drop.find({ guildId: guild.id, sellerId: interaction.user.id, sold: true })).map(drop => drop.number);
            }

            for (const number of dropNumbers) {
                const Drop = await db.Drop.findOne({ guildId: guild.id, number });
                if (Drop) {
                    if (subcommand === 'all') {
                        if (Member.verifyDrop(Drop) && Member.verifyPaycheck(Drop)) Drops.push(Drop)
                    } else Drops.push(Drop);
                } else dne.push(`\`#${number}\``);
            }

            if (subcommand === 'multiple' && dne.length) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `Drop(s): ${dne.join(', ')} does not exist.`, color: 'RED' }] });
            if (Drops.length === 0) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `There are no paychecks for ${Member.name} available for you to clear.`, color: 'RED' }] });

            for (const Drop of Drops) {
                if (!Member.verifyDrop(Drop)) excluded.push(`\`#${Drop.number}\``);
                else if (!Drop.sold) unsold.push(`\`#${Drop.number}\``);
                else if (!Member.verifyPaycheck(Drop)) paid.push(`\`#${Drop.number}\``);
                else drops.push(Drop.id);
            }

            if (excluded.length) text.push(`${user} was not part of Drop(s) ${excluded.join(', ')}'s split(s).`);
            if (unsold.length) text.push(`Drop(s) ${unsold.join(', ')} has not been sold yet.`);
            if (paid.length) text.push(`${user} has already been paid for Drop(s) ${paid.join(', ')}.`);
            if (text.length) return await interaction.followUp({ ephemeral: false,  embeds: [{ description: text.join('\n'), color: 'RED' }] });

            await Member.updateOne({ $pull: { paychecks: { $in: drops } } });

            return await interaction.followUp({ ephemeral: false,  embeds: [{ description: `Successfully marked Drop(s) ${Drops.map(drop => `\`#${drop.number}\``).join(', ')} as paid for ${user}.`, color: 'GREEN' }] });
        }
    },
};
