const { MessageEmbed } = require('discord.js');

module.exports = {
    data: {
        name: 'calculate',
        description: 'Computes an expression',
        options: [{
            name: 'expression',
            description: 'Enter your expression here.',
            type: 3,
            required: true,
        }],
    },
    async execute(interaction) {
        const dataValue = interaction.options.getString('expression');
        const expression = dataValue.split(/ +/).join('').split('');
        const fixedExpression = dataValue.split('^').join('**').replace(/\s+/g, '');

        for (let i = 0; i < expression.length; i++) {
            if (['+', '-', '*', '/', '^', '%'].includes(expression[i])) {
                expression[i] = ` ${expression[i]} `;
            }
        }

        const embed = new MessageEmbed()
            .setTitle('Calculator')
            .addField('Input:', `\`\`\`${expression.join('')} = ?\`\`\``);

        try {
            embed.setColor('GREEN').addField('Output:', `\`\`\`${Function(`'use strict'; return (${fixedExpression})`)()}\`\`\``);
        }
        catch {
            embed.setColor('RED').addField('Ooutput:', `\`\`\`${expression.join('')} is not a valid expression.\`\`\``);
        }

        return await interaction.reply({ embeds: [embed] });
    },
};
