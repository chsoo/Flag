/**
 * Created by multimedia on 2016-05-04.
 */

var userModel = require('../models/userdb');
var fileModel = require('../models/filedb');

var async = require('async');
var fs = require('fs');
var pathUtil = require('path');
var formidable = require('formidable');
var easyimage = require('easyimage');
var moment = require('moment');
var schedule = require('node-schedule');
var AWS = require('aws-sdk');

// var uploadDir = __dirname +'./../upload';
var uploadDir = __dirname + '/upload';
if (!fs.existsSync(uploadDir)) {
    console.error('upload 폴더 없음!');
    process.exit();
}

//버킷이름
var bucketName = "finalprojectflag";
var S3 = new AWS.S3("finalprojectflag.s3-website.ap-northeast-2.amazonaws.com");


exports.fileinfo = function (req, res, next) {
    var userID = req.query.userID;
    var flagName = req.query.flagName;
    console.log("query", userID, flagName);

    fileModel.findOne().and([{userID: userID},{flagName: flagName}]).exec(function (err,doc) {
        if(err){
            console.error('find file fail',err);
            next(err);
        }
        else{
            if(!doc){
                res.status(400).json({msg:'no file or no user'});
            }
            else{
                console.log('doc?',doc);
                var fileName = doc.fileName;
                var fileSize = doc.fileSize;
                res.json({fileName:fileName, fileSize:fileSize});
            }
        }
    });
};

exports.download = function (req, res, next) {
    var type = req.query.type;
    var userID = req.params.userID;
    var flagName = req.params.flagName;
    console.log('type??',type);
    console.log(userID, flagName);

    fileModel.findOne().and([{userID: userID},{flagName: flagName}]).exec(function (err,doc) {
        if(err){
            console.error('find file fail',err);
            next(err);
        }
        else{
            if(!doc){
                if(type == 'app'){
                    res.status(400).json({flag:{msg:"no flag", result:{}}});
                }
                else {
                    console.log('파일없음');
                    res.render('error');
                }
            }
            else if(doc.filePrivate == 'private'){
                if(type == 'app'){
                    res.status(400).json({flag:{msg:"private flag", result:{}}});
                }
                else {
                    console.log('비공개파일');
                    res.render('error');
                }
            }
            else {
                console.log('doc?', doc);

                var fileName = doc.userID + '_' + doc.flagName + '_' + doc.fileName; //파일명
                var itemKey = 'Flags/' + fileName;
                console.log('fileName?, itemKey?', fileName, itemKey);
                var params = {
                    Bucket: bucketName,
                    Key: itemKey
                }

                console.log('params?', params);
                if(type == 'app'){
                    res.attachment(itemKey);
                    var fileStream = S3.getObject(params).createReadStream();
                    fileStream.pipe(res);
                }
                else{
                    res.render('download',{fileName:fileName, userID:userID, flagName:flagName});
                }
            }
        }
    });
};
exports.filedownload = function (req, res, next) {
    var userID = req.params.userID;
    var flagName = req.params.flagName;

    console.log(userID, flagName);

    fileModel.findOne().and([{userID: userID},{flagName: flagName}]).exec(function (err,doc) {
        if(err){
            console.error('find file fail',err);
            next(err);
        }
        else{
            if(!doc){
                if(type == 'app'){
                    res.status(400).json({flag:{msg:"no flag", result:{}}});
                }
                else {
                    console.log('파일없음');
                    res.render('error');
                }
            }
            else if(doc.filePrivate == 'private'){
                if(type == 'app'){
                    res.status(400).json({flag:{msg:"private flag", result:{}}});
                }
                else {
                    onsole.log('비공개파일');
                    res.render('error');
                }
            }
            else {
                console.log('doc?', doc);

                var fileName = doc.userID + '_' + doc.flagName + '_' + doc.fileName; //파일명
                var itemKey = 'Flags/' + fileName;
                console.log('fileName?, itemKey?', fileName, itemKey);
                var params = {
                    Bucket: bucketName,
                    Key: itemKey
                }
                
                    res.attachment(itemKey);
                    var fileStream = S3.getObject(params).createReadStream();
                    fileStream.pipe(res);
            }
        }
    });
};


exports.upload = function (req, res, next) {
    var info;
    if(req.session.userID != undefined){
        info  = req.session.passport.user.userID;
    }
    else {
        info = undefined;
    }
    
    console.log('req.session.passport.user.userID',info);

    var form = new formidable.IncomingForm();
    var uploadInfo = {
        files : []
    };
    form.encoding = 'utf-8';
    form.uploadDir = uploadDir;
    async.waterfall([
        function (callback) {
            form.on('field', function (field, value) {
                    uploadInfo[field] = value;
                })
                .on('file', function(field,file){
                    uploadInfo.files.push(file);
                })
                .on('end',function(){
                    console.log(' >> uploadInfo done',uploadInfo);
                    callback(null, uploadInfo);
                });
            form.parse(req, function (err) {
                if (err) {
                    console.log('parse err', err);
                }
                console.log('parse success');
            });
        }, function(uploadInfo, callback){
            uploadInfo.userID = info;
            
            var files = uploadInfo.files;
            var fileUrls = [];

            fileModel.findOne({flagName: uploadInfo.flagName},function (err, doc) {
                if (err) {
                    next(err);
                }
                else if (doc) {
                    console.log('flagname doc?', doc);
                    if(uploadInfo.type == 'app'){
                        res.status(400).json({flag:{msg:"flag 중복",result:{}}});
                    }
                    else {
                        res.render('index',{userID:info, status:300});
                    }
                }
                else {
                    async.eachSeries(files, function(file, callback){
                        uploadInfo.fileName = files[0].name;
                        uploadFiles(file, uploadInfo, function (err, fileUrl) {
                            fileUrls.push(fileUrl);
                            callback(null,fileUrls);
                        });
                    },function (err) {
                        if(err){
                            callback(err);
                        }else{
                            console.log(fileUrls);
                            callback(null, uploadInfo, fileUrls);
                        }
                    });
                }
            });
        },function(uploadInfo, urls){
            var postInfo = {
                userID : info,
                fileSize : uploadInfo.files[0].size,
                fileName : uploadInfo.files[0].name,
                flagName : uploadInfo.flagName,
                filePrivate : uploadInfo.filePrivate,
                flagFile : []
            };
            async.each(urls, function (url, callback) {
                postInfo.flagFile.push({path : url.url});
                callback(null);
            }, function (err) {
                if(err){
                    console.log('file url 관리실패',err);
                    return res.status(400).json({flag:{msg: "file url fail", result:{}}});
                }
                else{
                    async.waterfall([
                        function (callback) {
                            fileModel.create(postInfo, function(err, doc){
                                if(err){
                                    console.error('fileModel create fail', err);
                                    return res.status(400).json({flag:{msg: "fileModel.create fail"}});
                                }
                                else{
                                    console.log('fileModel create 성공!', doc);
                                }
                                callback(null,doc);
                            });
                        },function (doc, callback) {
                            var updateData = {$push: {flags:{flagName: doc.flagName, flagID: doc.flagID, _id: doc._id,fileSize:doc.fileSize, date:doc.date}}};
                            var flagNameWeb = doc.flagName;
                            userModel.findOneAndUpdate({userID: doc.userID}, updateData, function (err, updateDoc) {
                                if(err){
                                    if(uploadInfo.type == 'app'){
                                        res.status(400).json({flag:{msg:"user's flags update fail",result:{}}});
                                    }
                                    else {
                                        res.render('index', {status: 400});
                                        return next(err);
                                    }
                                    console.error('find id and update',err);
                                    callback(err);
                                }
                                else{
                                    console.log("userModel update 됐나요?",updateDoc);
                                    if(uploadInfo.type == 'app'){
                                        res.status(200).json({flag: {msg: "fileUpload Success", result: {}}});
                                    }
                                    else{
                                        res.render('index', {status: 200, userID: info, flagName:flagNameWeb});
                                    }
                                    callback(null, updateDoc);
                                }
                            });
                        }
                    ],function (err) {
                        if(err){
                            console.error('async error',err);
                            return next(err);
                        }
                        return ;
                    });
                }
            });
        }
    ],function(err){
        if(err){
            console.log('500 error');
        }
    });
};

//get
exports.delete = function (req, res, next){
    var flagID = req.query.flagID;
    var info;
    if(req.session.userID != undefined){
        info  = req.session.userID;
    }
    else {
        info = undefined;
    }

    console.log('can u get flagID?',flagID);
    
    async.waterfall([
        function (callback) {
            fileModel.findOneAndRemove({flagID : flagID}, function (err, doc) {
                if(err){
                    console.log('find flagID err', err);
                    res.render('error');
                    return next(err);
                }
                else{
                    console.log('find and remove doc',doc);
                    callback(null,doc);
                }
            });
        },function (doc, callback) {
            console.log('why?');
            var updateFlags = {$pull: {flags:{flagID: doc.flagID}} };
            userModel.findOneAndUpdate({userID : info},updateFlags,function (err) {
                if(err){
                    console.log('userid flags pop 중 에러',err);
                    next(err);
                }
                else{
                    console.log('userModel array pop');
                    res.redirect(req.get('referer'));
                    callback(null);
                }
            });
        }
    ],function (err) {
        if(err){
            console.log('error????',err);
            return next(err);
        }
        else{
            console.log('waterfall 성공');
        }
    });
};

//post -app
exports.deleteapp = function (req, res, next){
    var _id = req.body._id;
    var info;
    if(req.session.userID != undefined){
        info  = req.session.userID;
    }
    else {
        info = undefined;
    }

    console.log('can u get _id?',_id);

    async.waterfall([
        function (callback) {
            fileModel.findOneAndRemove({_id : _id}, function (err, doc) {
                if(err){
                    console.log('find flagID err', err);
                    res.status(400).json({flag: {msg: "delete fail", result: {}}});
                    return next(err);
                }
                else{
                    console.log('find and remove doc',doc);
                    callback(null,doc);
                }
            });
        },function (doc, callback) {
            var updateFlags = {$pull: {flags:{_id: doc._id}} };
            console.log('');
            userModel.findOneAndUpdate({userID : info},updateFlags,function (err) {
                if(err){
                    console.log('userid flags pop 중 에러',err);
                    res.status(400).json({flag: {msg: "fail", result: {}}});
                    next(err);
                }
                else{
                    console.log('userModel array pop');
                    res.status(200).json({flag: {msg: "delete success", result: {}}});
                    callback(null);
                }
            });
        }
    ],function (err) {
        if(err){
            console.log('error????',err);
            return next(err);
        }
        else{
            console.log('waterfall 성공');
        }
    });
};

exports.private = function (req, res, next){
    var flagID = parseInt(req.query.flagID);
    console.log('private flaID?',flagID);
    var info;
    if(req.session.userID != undefined){
        info  = req.session.userID;
    }
    else {
        info = undefined;
    }

    async.waterfall([
        function (callback) {
            fileModel.findOne({flagID : flagID},function (err,doc) {
                if(err){
                    console.log('change private err',err);
                    res.render('error');
                    next(err);
                }
                else{
                    var fileStatus = doc.filePrivate;
                    console.log('flagID의 file ',doc);
                    callback(null,fileStatus);
                }
            });
        },function (fileStatus, callback) {
            console.log('doc.filePriavte 이전',fileStatus);
            if(fileStatus == 'public'){
                fileModel.update({flagID:flagID},{$set:{filePrivate:'private'}},function (err,doc) {
                    if(err){
                        console.log('err',err);
                        next(err);
                    }
                    else {
                        console.log('doc.Private?',doc.filePrivate);
                        res.redirect(req.get('referer'));
                        callback(null);
                    }
                });
            }
            else if(fileStatus == 'private'){
                console.log('doc.filePriavte 이전',fileStatus);
                fileModel.update({flagID:flagID},{$set:{filePrivate:'public'}},function (err,doc) {
                    if(err){
                        console.log('err',err);
                        next(err);
                    }
                    else {
                        console.log('doc.Private?',doc.filePrivate);
                        res.redirect(req.get('referer'));
                        callback(null);
                    }
                });
            }
        }
    ],function (err) {
        if(err){
            console.log('error????',err);
            return next(err);
        }
        else{
            console.log('waterfall 성공');
        }
    });
};

exports.privateapp = function (req, res, next){
    var type = req.body.type;
    var _id = req.body._id;

    fileModel.findOne({_id : _id}, function (err,doc) {
        if(err){
            console.log('change private err',err);
            next(err);
        }
        else{
            if(doc.filePrivate == 'public'){
                fileModel.update({_id:_id},{$set:{filePrivate:'private'}},function (err,doc) {
                    if(err){
                        console.log('err',err);
                        next(err);
                    }
                    else {
                        if (type == 'app') {
                            res.status(200).json({flag: {msg: "change private success", result: {}}});
                        }
                        else {
                            res.redirect(req.get('referer'));
                        }
                    }
                });
            }
            else if(doc.filePrivate == 'private'){
                fileModel.update({_id:_id},{$set:{filePrivate:'public'}},function (err,doc) {
                    if(err){
                        console.log('err',err);
                        next(err);
                    }
                    else {
                        if (type == 'app') {
                            res.status(200).json({flag: {msg: "change private success", result: {}}});
                        }
                        else {
                            res.redirect(req.get('referer'));
                        }
                    }
                });
            }
        }
    });

};

exports.list = function (req,res, next) {
    var type = req.body.type;
    var user = req.params.userID;
    var email;
    var info;
    if(req.session.userID != undefined){
       info  = req.session.passport.user.userID;
    }
    else {
        console.log('undefinde filetype?',user, typeof(user));
        info = undefined;
    }

    console.log('params userID?',user);
    // console.log('session userID?',userID);
    var flagsList = [];
    var flagsArray = [];
    var totalFileSIze = 0;

    if(user == 'signout'){
        console.log('signout이에요');
        req.session.destroy(function (err) {
            if(err){
                console.error('signout err',err);
                next(err);
            }else {
                if(type == 'app'){
                    res.status(200).json({flag:{msg:'sucess', result:{}}});
                }else {
                    console.log('session destroy r u ok?');
                    res.render('index', {userID: undefined, status:0});
                }
            }
        });
    }


     else{
        async.waterfall([
                function (callback) {

                    userModel.findOne({userID: user}, function (err, doc) {
                        if (err) {
                            console.log('find id error');
                            next(err);
                        }
                        else {
                            if(!doc){
                                console.log('파일목록없음');
                                res.render('error');
                            }else {
                                console.log(doc.userID);
                                flagsArray = doc.flags;
                                email = doc.email;
                                totalFileSIze = doc.daySize;
                                callback(null, flagsArray, email);
                            }
                            }
                        });
                },
                function (flagsArray, email, callback) {
                    async.each(flagsArray, function (flags, eachCallback) {
                        fileModel.findOne({flagID: flags.flagID}).sort({date: -1}).exec(function (err, doc) {
                            if (err) {
                                return next(err);
                            }
                            else {
                                var usersFlags = {
                                    fileSize : doc.fileSize,
                                    filePrivate: doc.filePrivate,
                                    flagName: doc.flagName,
                                    fileName: doc.fileName,
                                    flagID: doc.flagID,
                                    _id: doc._id,
                                    date: doc.date
                                }
                                flagsList.push(usersFlags);
                                eachCallback(null);
                            }
                        });
                    }, function (err) {
                        if (err) {
                            console.log('async each err', err);
                            return next(err);
                        }
                        callback(null);
                    });
                }
            ],
            function (err) {
                if (err) {
                    console.log('async waterfall err', err);
                    // res.status(400).json({flag: {msg: "fail", result: {}}});
                    res.render('error');
                    return next(err);
                }
                else {
                    console.log('get flags list success!!', flagsList);
                    res.render('Userpage', {flags: flagsList, pageID: user, userID: info, email: email, daySize:totalFileSIze});
                }
            });
    }
};

exports.listapp = function (req, res, next) {
    // var type = req.body.type;
    var user = req.params.userID;
    var email;
    console.log("app 마이페이지 리스트 조회");
    
    var flagsList = [];
    var flagsArray = [];

    if(user == 'signout'){
        console.log('signout이에요');
        req.session.destroy(function (err) {
            if(err){
                console.error('signout err',err);
                res.status(400).json({flag:{msg:"signout fail", result:{}}});
                next(err);
            }else {
                console.log('session destroy r u ok?');
                res.status(200).json({flag:{msg:"signout", result:{}}});
            }
        });
    }
    else{
        async.waterfall([
                function (callback) {
                    userModel.findOne({userID: user}, function (err, doc) {
                        if (err) {
                            console.log('find id error');
                            next(err);
                        }
                        else {
                            if(!doc){
                                res.status(400).json({flag:{msg:"no document"}});
                            }else {
                                flagsArray = doc.flags;
                                email = doc.email;
                                console.log('APPP  flagsArray??', flagsArray);
                                callback(null, flagsArray, email);
                            }
                        }
                    });
                },
                function (flagsArray, email, callback) {
                    async.each(flagsArray, function (flags, eachCallback) {
                        fileModel.findOne({flagID: flags.flagID}).sort({date: -1}).exec(function (err, doc) {
                            if (err) {
                                return next(err);
                            }
                            else {
                                var usersFlags = {
                                    filePrivate: doc.filePrivate,
                                    flagName: doc.flagName,
                                    fileName: doc.fileName,
                                    flagID: doc.flagID,
                                    _id: doc._id,
                                    date: doc.date
                                }
                                flagsList.push(usersFlags);
                                eachCallback(null);
                            }
                        });
                    }, function (err) {
                        if (err) {
                            console.log('async each err', err);
                            return next(err);
                        }
                        callback(null);
                    });
                }
            ],
            function (err) {
                if (err) {
                    console.log('APPPP async waterfall err', err);
                    res.status(400).json({flag: {msg: "fail", result: {}}});
                    return next(err);
                }
                else {
                    console.log('APPP get flags list success!!', flagsList);
                    res.status(200).json({msg:"susccess", result:{file:flagsList}});
                }
            });
    }
};
/*exports.applist = function (req,res, next) {
    var user = req.params.userID;
    // var userID = req.session.passport.user.userID;
    console.log('params userID?',user);
    // console.log('session userID?',userID);

    var flagsList = [];
    var flagsArray = [];

    async.waterfall([
            function (callback) {
                userModel.findOne({userID : user},function(err, doc){
                    if(err){
                        console.log('find id error');
                        next(err);
                    }
                    else{
                        flagsArray = doc.flags;
                        console.log('flagsArray??', flagsArray);
                        callback(null,flagsArray);
                    }
                });
            },
            function (flagsArray, callback) {
                async.each(flagsArray, function (flags, eachCallback) {
                    fileModel.findOne({flagID: flags.flagID}).sort({flagsID:-1}).exec(function (err, doc) {
                        if(err){
                            return next(err);
                        }
                        else{
                            var usersFlags ={
                                userID : user,
                                flagName : doc.flagName,
                                fileName : doc.fileName,
                                flagID : doc.flagID,
                                _id : doc._id
                                // filePrivate : doc.filePrivate
                            }
                            flagsList.push(usersFlags);
                            eachCallback(null);
                        }
                    });
                },function (err) {
                    if(err){
                        console.log('async each err',err);
                        return next(err);
                    }
                    callback(null);
                });
            }
        ],
        function (err) {
            if(err){
                console.log('async waterfall err',err);
                res.status(400).json({flag: {msg: "fail", result: {}}});
                return next(err);
            }
            else{
                    console.log('get flags list success!!',flagsList);
                    res.status(200).json({flag: {msg: "success", result: {file: flagsList}}});
            }
        });
};*/


//S3 파일 업로드 함수
function uploadFiles(file, uploadInfo, callback){
    var fileUrl = {};

    var extname = pathUtil.extname(file.name);
    // var fileName = uploadInfo.fileName + "(" + uploadInfo.userID + '_' + uploadInfo.flagName + ")" + extname; //파일명
    var fileName = uploadInfo.userID + '_' + uploadInfo.flagName + '_' + uploadInfo.fileName; //파일명
    var contentType = file.type;
    var readStream = fs.createReadStream(file.path);
    var itemKey = 'Flags/'+ fileName;

    var params = {
        Bucket:bucketName,
        Key: itemKey,
        ACL: 'public-read',
        Body: readStream,
        ContentType: contentType
    }

    console.log("fileNAME", fileName);
    S3.putObject(params, function (err, data) {
        if (err) {
            console.error('S3 Putobject Error', err);
           callback(err);
        } else {
            var fileURLs = S3.endpoint.href + bucketName + '/' + itemKey;
            fileUrl.url = fileURLs;
            console.log("s3object data?",data);
            callback(null, fileUrl);
        }
    });
}


var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0,1,2,3,4,5,6];
rule.hour = 0;
rule.minute = 0;

schedule.scheduleJob(rule, function(){
    async.waterfall([userFinder, userUsedDayFileSizeUpdate],erroHandler);
});

function userUsedDayFileSizeUpdate(users)  {
    for(var i = 0 ; i < users.length ; i++ ) {
        var fileTotalSize = 0;
        for(var j = 0 ; j < users[i].flags.length ; j++) {
            fileTotalSize += users[i].flags[j].fileSize;
        }

        var updateData = {$push: {daySize:{fileSize:fileTotalSize}}};
        userModel.update({userID: users[i].userID},updateData,function (err, doc) {
            if(err){
                console.log('update daySize derr',err);
                next(err);
            }
            else{
                console.log('day file size update finish',doc);
            }
        });
    }
}

function  erroHandler(err) {
    if (err) {
        console.log('err', err);
    }
}

function userFinder(callback) {
    userModel.find().exec(function(err, users){
        console.log('start user fineder');
        if (err) {
            console.log('find id error');
        }
        else {
            callback(null, users);
        }
    });
}
