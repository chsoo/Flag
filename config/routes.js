/**
 * Created by multimedia on 2016-05-03.
 */

var express = require('express');
var router = express.Router();
var user = require('../controll/user');
var file = require('../controll/file');

//PROJECT START
router.post('/signup', user.signup); //회원가입 
router.post('/idcheck', user.idcheck); //아이디 중복확인
router.get('/',user.mainpage); //메인페이지

router.get('/fileInfo', file.fileinfo); //파일정보
router.get('/:userID/:flagName', file.download); //파일 다운로드
router.get('/download/:userID/:flagName', file.filedownload); //파일 다운로드web
router.post('/fileUpload', file.upload); //파일 업로드
router.get('/fileDelete', file.delete); //파일 삭제 web
router.post('/fileDelete', file.deleteapp); //파일 삭제 app
router.get('/filePrivate', file.private); //파일 공개여부
router.post('/filePrivate', file.privateapp); //파일 공개여부
router.get('/:userID', file.list); //파일 목록조회 web
router.post('/:userID', file.listapp); //파일 목록조회 app

module.exports = router;