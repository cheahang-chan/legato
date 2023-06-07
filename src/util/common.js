function getDropString(guildId, channelId, paycheck) {
    console.log(paycheck);
    return `[Drop #${paycheck.number} - ${paycheck.item} (${paycheck.boss})](https://discord.com/channels/${guildId}/${channelId}/${paycheck.saleMessageId}):\nManager: <@${paycheck.sellerId}>\n${paycheck.split ? `${paycheck.split.toLocaleString()} mesos\n` : ''}`;
}

module.exports.getDropString = getDropString;