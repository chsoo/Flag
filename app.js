var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var mongoose = require('mongoose');
var session = require('express-session');

// Database Connect
var uri = "mongodb://localhost:27017/flagdb";
// var uri = "mongodb://52.79.140.129:2222/flagdb";

global.db = mongoose.createConnection(uri);
var MongoDB = mongoose.connect(uri).connection;
MongoDB.on('mongo error',function (err) {
    console.log(err.message);
});
MongoDB.once('open',function () {
    console.log("mongodb connection open");
});


var AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-2';
AWS.config.accessKeyId = 'AKIAJ3RAA34PA6O7IIWQ';
AWS.config.secretAccessKey = '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';

// Routes
// var test = require('./config/routes');
// var main = require('./routes/index');
var router = require('./config/routes');
var userModel = require('./models/userdb');

passport.serializeUser(function(user, done) {
    console.log('serialize');
    done(null, user);
});

// 인증 후, 페이지 접근시 마다 사용자 정보를 Session에서 읽어옴.
passport.deserializeUser(function(user, done) {
    console.log('deserialize');
    done(null, user);
});

passport.use(new LocalStrategy({
        usernameField : 'userID',
        passwordField : 'userPW',
        passReqToCallback : true
    }
    ,function(req, userID, userPW, done) {
        console.log('LocalStrategy :', userID, userPW);
        var password = parseInt(userPW);
        userModel.find({userID : userID},function(err, docs){
            if(err){
                console.error('세션 인증 에러 : ', err);
            }
            console.log('docs?',docs);
            console.log('docs[0]?',docs[0]);
            var user=docs[0];

            //사용자가 없는 경우
            if(!user){
                console.error('사용자가 없어');
                return done(null, false);
            }else{
                if(user.userPW != password)
                {
                    console.log('비밀번호가 틀렸어');
                    return done(null, false);
                }else{
                    console.log('session', user.userID);
                    return done(null, user);
                }
            }
        });
    }
));

var app = express();

app.use(flash());
app.use(passport.initialize());
app.use(session({
    secret:'finalprojectflag',
    resave : false,
    saveUnintialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon_flag.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //css



//로그인
app.post('/signin',function(req,res){
    var type = req.body.type;
    console.log('req.body?????',req.body);
    passport.authenticate('local', function(err, user) {
        if ( ! user ) {
            if( type =='app'){
                res.status(400).json({msg:"login fail, no user",result:{}});
            }
            else {
                console.log('no user');
                res.render('index',{userID: undefined, status:500});
            }
            return;
        }
        // 세션에 기록
        req.logIn(user, function(err) {
            if ( err ) {
                if(type == 'app'){
                    res.status(401).json({msg:"session fail",result:{}});
                }
                else{
                    res.render('error');
                }
                return;
            }
            userModel.findOne({userID: user.userID}, function (err, doc) {
                if(err){
                    console.log('findOne err',err);
                    res.send('err ' + err);
                    return;
                }
                else{
                    console.log('req.session?',req.session.passport.user.userID);
                    req.session.userID = user.userID;
                    console.log('req.session.userID?',req.session.userID);
                    if(type == 'app'){
                        res.status(200).json({msg:"login success",result:{user:{_id:user._id, userID : user.userID, email: user.email, flags: user.flags}}});
                    }
                    else{
                        res.render('index',{userID:user.userID, status:0});
                    }
                }
            });
        });
    })(req);
});
//로그아웃
app.post('/signout',function (req, res ) {
    var type = req.body.type;
        req.session.destroy(function (err) {
            if(err){
                console.error('signout err',err);
                next(err);
            }else {
                if(type == 'app'){
                    console.log('session destroy r u ok?');
                    res.json({flag:{msg:"로그아웃"}});
                }
                else{
                    console.log('session destroy r u ok? web');
                    res.render('index',{userID : undefined, status :0});
                }
                

            }
        });
        // res.redirect(req.get('referer'));

});

// app.use('/', main);
app.use('/', router);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(3000, function () {
    console.log('server is running 3000');
});

module.exports = app;
