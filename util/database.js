const firebase = require('../node_modules/firebase');
const DatabaseConfig = require('../config.json');

firebase.initializeApp(DatabaseConfig.firebase);

exports.firebase = firebase;
