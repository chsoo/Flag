/**
 * Created by multimedia on 2016-05-03.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    userID: {type: String},
    userPW: {type: String},
    email: {type: String},
    flags : [],
    daySize : []
});

module.exports = db.model('user', userSchema);