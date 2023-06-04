module.exports = (mongoose) => {
    const guildSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        name: String,
        dropsChannelId: String,
        salesChannelId: String,
        paychecksChannelId: String,
        dropCounter: Number,
        drops: [{ type: mongoose.ObjectId, ref: 'Drop' }],
        parties: [String],
    }, {
        versionKey: false,
    });

    guildSchema.methods.verifyParty = function(roleId) {
        const parties = this.parties;
        return parties.includes(roleId);
    };

    return mongoose.model('Guild', guildSchema);
};
