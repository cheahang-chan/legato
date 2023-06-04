const { Permissions } = require('discord.js');
const db = require('../../util/database');

module.exports = {
    data: {
        name: 'party',
        description: 'Create, delete, edit, link, or unlink a party.',
        options: [{
            name: 'create',
            description: 'Create a new party role.',
            type: 1,
            options: [{
                name: 'name',
                description: 'What would you like to name this party.',
                type: 3,
                required: true,
            }, {
                name: 'member-1',
                description: 'Input 1st member of the party.',
                type: 6,
                required: true,
            }, {
                name: 'member-2',
                description: 'Input 2nd member of the party.',
                type: 6,
                required: true,
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
        }, {
            name: 'delete',
            description: 'Delete a party role.',
            type: 1,
            options: [{
                name: 'role',
                description: 'Input the party role here.',
                type: 8,
                required: true,
            }],
        }, {
            name: 'edit',
            description: 'Add/remove a member from a party.',
            type: 1,
            options: [{
                name: 'role',
                description: 'Input the party role that you would like to edit.',
                type: 8,
                required: true,
            }, {
                name: 'action',
                description: 'Choose if you like to add or remove a member from the party.',
                type: 3,
                required: true,
                choices: [{
                    name: 'Add',
                    value: 'add',
                }, {
                    name: 'Remove',
                    value: 'remove',
                }],
            }, {
                name: 'member',
                description: 'Input the member that you would like to add/remove.',
                type: 6,
                required: true,
            }],
        }, {
            name: 'link',
            description: 'Link a pre-existing discord role to a party.',
            type: 1,
            options: [{
                name: 'role',
                description: 'Input the party role here.',
                type: 8,
                required: true,
            }],
        }, {
            name: 'unlink',
            description: 'Unlink a party role back to a normal discord role.',
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

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const role = await guild.roles.create({ name: name });
            const members = [
                interaction.options.getMember('member-1'),
                interaction.options.getMember('member-2'),
                interaction.options.getMember('member-3'),
                interaction.options.getMember('member-4'),
                interaction.options.getMember('member-5'),
                interaction.options.getMember('member-6'),
            ].filter(Boolean);

            if ((new Set(members)).size !== members.length) return await interaction.reply({ embeds: [{ description: 'Something is wrong.\nYou have entered a member more than once.\nPlease recreate the party.', color: 'YELLOW' }] });

            for (const member of members) {
                member.roles.add(role);
            }

            await Guild.updateOne({ $push: { parties: role.id } });
            return await interaction.reply({ embeds: [{ description: `Created ${role} with members: ${members}`, color: 'GREEN' }] });
        }
        else if (subcommand === 'delete') {
            const role = interaction.options.getRole('role');

            if (!Guild.verifyParty(role.id)) return await interaction.reply({ embeds: [{ description: `${role} is not a party role.`, color: 'RED' }] });

            role.delete();
            await Guild.updateOne({ $pull: { parties: role.id } });
            return await interaction.reply({ embeds: [{ description: `Sucessfully deleted \`${role.name}\``, color: 'GREEN' }] });
        }
        else if (subcommand === 'edit') {
            const role = interaction.options.getRole('role');
            const action = interaction.options.getString('action');
            const member = interaction.options.getMember('member');

            if (!Guild.verifyParty(role.id)) return await interaction.reply({ embeds: [{ description: `${role} is not a party role.`, color: 'RED' }] });

            if (action === 'add') {
                if (role.members.size >= 6) return await interaction.reply({ embeds: [{ description: `${role} already has 6 members. You cannot add anymore`, color: 'RED' }] });
                if (member.roles.cache.has(role.id)) return await interaction.reply({ embeds: [{ description: `${member} is already in ${role}.`, color: 'YELLOW' }] });

                member.roles.add(role);
                return await interaction.reply({ embeds: [{ description: `Sucessfully added ${member} to ${role}.`, color: 'GREEN' }] });
            }
            else {
                if (role.members.size === 0) return await interaction.reply({ embeds: [{ description: `${role} has 0 members. There is no one to remove.`, color: 'RED' }] });
                if (!member.roles.cache.has(role.id)) return await interaction.reply({ embeds: [{ description: `${member} is not in ${role}.`, color: 'RED' }] });

                member.roles.remove(role);
                return await interaction.reply({ embeds: [{ description: `Sucessfully removed ${member} from ${role}.`, color: 'GREEN' }] });
            }
        }
        else if (subcommand === 'link') {
            const role = interaction.options.getRole('role');
            const members = role.members;

            if (role.managed) return await interaction.reply({ embeds: [{ description: `${role} is a \`managed\` role. You cannot use that as a party role.`, color: 'RED' }] });
            if (Guild.verifyParty(role.id)) return await interaction.reply({ embeds: [{ description: `${role} is already a party role.`, color: 'RED' }] });
            if (members.size > 6) return await interaction.reply({ embeds: [{ description: `This role has ${members.size} users. You cannot create a party with over 6 members.`, color: 'RED' }] });

            await Guild.updateOne({ $push: { parties: role.id } });
            return await interaction.reply({ embeds: [{ description: `${role} is now a party with members: ${members.size ? members.map(member => member).sort((first, second) => first.id - second.id).join(', ') : '`none`'}`, color: 'GREEN' }] });
        }
        else if (subcommand === 'unlink') {
            const role = interaction.options.getRole('role');

            if (!Guild.verifyParty(role.id)) return await interaction.reply({ embeds: [{ description: `${role} is not a party role.`, color: 'RED' }] });

            await Guild.updateOne({ $pull: { parties: role.id } });
            return await interaction.reply({ embeds: [{ description: `${role} is no longer a party role.`, color: 'GREEN' }] });
        }
    },
};
