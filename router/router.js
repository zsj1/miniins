var formidable = require('formidable');
var db = require('../models/db');
var md5 = require('../models/md5');
var session = require('express-session');
// 首页
exports.showIndex = function(req, res, next) {
     res.render("index", {
        "login": req.session.login === "1" ? true : false,
        "username": req.session.login === "1" ? req.session.account : "",
     });
}

// 注册页面
exports.showRegister = function(req, res, next) {
    res.render("register", {
        "login": req.session.login === "1" ? true : false,
        "username": req.session.login === "1" ? req.session.account : "",
     });
}

// 注册业务
exports.doRegister = function(req, res, next) {
    // 获取账户名和密码
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fileds, files) {
        var username = fileds.account;
        var password = fileds.password;
        // 查询用户名是否重复
        db.find("users", {"username": username}, function(err, result){
            if (err) {
                res.send("-3");
                return;
            }
            if (result.length != 0) {
                res.send("-1");
                return;
            }
            // 用户名未被占用，可以插入
            // md5加密
            password = md5(md5(password) + "sliver");
            db.insertOne("users", {
                "username": username,
                "password": password,
            }, function(err, result){
                if (err) {
                    res.send("-3");
                    return;
                }
                // 注册成功，直接登录，写入session
                req.session.login = "1";
                req.session.account = username;
                res.send("1");
            });
        });
    });
}