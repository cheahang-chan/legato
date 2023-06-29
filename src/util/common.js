function getDropString(guild, paycheck) {
    const messageId = paycheck.saleMessageId ? paycheck.saleMessageId : paycheck.dropMessageId;
    const channelId = paycheck.saleMessageId ? guild.salesChannelId : guild.dropsChannelId;
    return `[#${paycheck.number} - ${paycheck.item} (${paycheck.boss})](https://discord.com/channels/${guild.id}/${channelId}/${messageId}):\nManager: <@${paycheck.sellerId}>\n${paycheck.split ? `${paycheck.split.toLocaleString()} mesos\n` : ''}`;
}

module.exports.getDropString = getDropString;