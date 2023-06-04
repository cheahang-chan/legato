module.exports = (mongoose) => {
    const dropSchema = new mongoose.Schema({
        guildId: String,
        number: Number,
        dropMessageId: String,
        saleMessageId: String,
        boss: String,
        item: String,
        partySize: Number,
        party: [{ type: mongoose.ObjectId, ref: 'Member', autopopulate: true }],
        price: Number,
        sold: Boolean,
    }, {
        versionKey: false,
    });

    dropSchema.index({ guildId: 1, number: 1 }, { unique: true });

    dropSchema.virtual('taxed').get(function() {
        return this.price - Math.floor(this.price * 0.05);
    });
    dropSchema.virtual('split').get(function() {
        return Math.round(this.taxed / this.partySize);
    });

    dropSchema.plugin(require('mongoose-autopopulate'));

    return mongoose.model('Drop', dropSchema);
};
