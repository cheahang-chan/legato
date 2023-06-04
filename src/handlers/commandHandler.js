const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandSearch = (dir) => {
        const commandFiles = fs.readdirSync(path.join(__dirname, dir));
        for (const file of commandFiles) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file));
            if (stat.isDirectory()) {
                commandSearch(path.join(dir, file));
            }
            else {
                const command = require(path.join(__dirname, dir, file));
                client.commands.set(command.data.name, command);
                client.commandData.push(command.data);
            }
        }
    };
    commandSearch('../commands');
};
