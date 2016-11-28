/**
 * Created by multimedia on 2016-05-04.
 */
var mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment');;
var Schema = mongoose.Schema;


autoIncrement.initialize(db);

var fileSchema = new Schema({
    flagID : {type: Number},
    userID : {type: String},
    fileName : {type: String},
    fileSize : {type: Number},
    flagName : {type: String},
    filePrivate : {type: String},
    flagFile : [],
    date : {type: Date, default: Date.now}
});

fileSchema.plugin(autoIncrement.plugin, {model:'flagfile', field:'flagID'});
module.exports = db.model('flagfile', fileSchema);