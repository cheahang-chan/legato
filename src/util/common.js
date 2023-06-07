function getDropString(guildId, channelId, paycheck) {
    return `[Drop #${paycheck.number} - ${paycheck.item} (${paycheck.boss})](https://discord.com/channels/${guildId}/${channelId}/${paycheck.saleMessageId}):\nItem Manager: <@${paycheck.sellerId}>\n${paycheck.split ? `${paycheck.split.toLocaleString()} mesos\n` : ''}`;
}

module.exports.getDropString = getDropString;