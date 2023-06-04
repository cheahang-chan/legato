module.exports = (mongoose) => {
    const memberSchema = new mongoose.Schema({
        guildId: String,
        userId: String,
        name: String,
        drops: [{ type: mongoose.ObjectId, ref: 'Drop' }],
        paychecks: [{ type: mongoose.ObjectId, ref: 'Drop', autopopulate: true }],
    }, {
        versionKey: false,
    });

    memberSchema.virtual('payment').get(function() {
        let payment = 0;

        this.paychecks.forEach(drop => {
            payment += drop.split;
        });

        return payment;
    });

    memberSchema.methods.verifyDrop = function(drop) {
        const drops = this.drops;
        return drops.includes(drop.id);
    };

    memberSchema.methods.verifyPaycheck = function(drop) {
        const paychecks = this.paychecks;
        return paychecks.some(paycheck => paycheck.id === drop.id);
    };

    memberSchema.plugin(require('mongoose-autopopulate'));

    return mongoose.model('Member', memberSchema);
};
