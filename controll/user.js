/**
 * Created by multimedia on 2016-05-03.
 */
var userModel = require('../models/userdb');

 /*exports.signin = function (req, res, next) {
 var userID = req.body.userID;
 // var type = req.query.type;

 userModel.findOne({userID : userID}).exec(function(err, doc) {
 console.log(doc);
 if(err){
 return next(err);
 }
 else if(doc==null) {
 console.log("test get string err", err);
 // res.json({flag: {code: 400, msg: "GET String FAIL", result: {}}});
 res.redirect('../views/error');
 }
 else {
 console.log("get string ok", doc.userID);
 // res.json({flag: {code: 200, msg: "GET String OK", result: {data: doc}}});
 // res.render('index',{flag: {code: 200, msg: "GET String OK", result: {data: doc}}});
 // res.redirect(__dirname+'views/index');
 res.render('index',{userID: doc.userID});
 }
 });
 };*/

exports.mainpage = function (req, res, next) {
    var info;
    if(req.session.userID != undefined){
         info  = req.session.passport.user.userID;
    }
    else {
        info = undefined;
    }
    res.render('index', {userID : info, status: 0,flagName:undefined});
};

exports.signup = function (req, res, next) {
    var type = req.body.type;
    var data = {
        userID : req.body.userID,
        userPW : req.body.userPW,
        email : req.body.email
    }
    userModel.findOne({userID: data.userID},function (err, doc) {
        if(err){
            next(err);
        }
        else if(doc){
            if(type == 'app'){
                res.status(400).json({flag:{msg:"존재하는ID",result:{}}});
            }
            else {
                console.log('회원가입 ID중복체크');
                res.send('ID 중복됨');
            }
        }
        else{
            userModel.create(data, function (err, doc) {
                var type = req.body.type;
                if(err){
                    console.error('test string create err', err);
                    res.status(400).json({flag: {msg: "signup FAIL", result: {}}});
                    return next(err);
                }
                else{
                    if( type == "app"){
                        res.status(200).json({flag: {msg: "signup OK", result: {user: doc}}});
                    }
                    else {
                        res.render('welcome',{userID : doc.userID});
                    }
                }
            });
        }
    });

};

exports.idcheck = function(req, res, next){
    var userID = req.body.userID;
    var type = req.body.type;

    userModel.findOne({userID: userID},function (err, doc) {
        if(err){
            console.error(err);
            return next(err);
        }
        if(doc){
            if(type == 'app'){
                console.log('이미 존재하는 ID');
                res.status(400).json({flag: {msg: "already exist ID", result: {}}});
            }
            else{
                console.log('이미 존재하는 ID');
                res.send({status:400});
            }
        }
        else{
            if(type == 'app'){
                console.log('사용가능한 ID');
                res.status(200).json({flag: {msg: "success", result: {}}});
            }
            else{
                console.log('사용가능한 ID');
                res.send({status:200});
            }
        }
    })
}
