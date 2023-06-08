function getDropString(guildId, channelId, paycheck) {
    const messageId = paycheck.saleMessageId ? paycheck.saleMessageId : paycheck.dropMessageId;
    // TODO: saleMessageId should eventually be null in the future

    return `[Drop #${paycheck.number} - ${paycheck.item} (${paycheck.boss})](https://discord.com/channels/${guildId}/${channelId}/${messageId}):\nItem Manager: <@${paycheck.sellerId}>\n${paycheck.split ? `${paycheck.split.toLocaleString()} mesos\n` : ''}`;
}

module.exports.getDropString = getDropString;