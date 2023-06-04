const fs = require('fs');
const mongoose = require('mongoose');
const db = {};

db.init = () => {
    mongoose.connect(process.env.MONGO_URI);
    mongoose.Promise = global.Promise;

    mongoose.connection.on('connected', () => {
        console.log('MongoDB has successfully connected!');
    });

    mongoose.connection.on('err', err => {
        console.error(`Mongoose connection error: \n${err.stack}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('Mongoose connection lost');
    });
};

fs.readdirSync('./src/util/database/models')
    .filter(file => file.endsWith('.js'))
    .forEach(file => {
        const model = require(`./models/${file}`)(mongoose);
        db[model.modelName] = model;
    });

module.exports = db;
