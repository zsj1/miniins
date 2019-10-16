var formidable = require('formidable');
var db = require('../models/db');
var md5 = require('../models/md5');
var session = require('express-session');
var path = require("path");
var fs = require("fs");
var gm = require("gm");
// 首页
exports.showIndex = function (req, res, next) {
    // 查找头像
    var avatar = "default.jpg";
    // db.find("users", { "username": req.session.login === "1" ? req.session.account : "" }, function (err, result) {
    //     if (result.length !== 0) {
    //         avatar = result[0].avatar || "default.jpg";            
    //     }
    //     db.find("posts", {}, {"sort": { "datetime": -1}}, function(err, result2) {
    //         var dynamics = new Array();
    //         (function iterator(i){
    //             //遍历结束
    //             if(i === result2.length) {
    //                 res.render("index", {
    //                     "login": req.session.login === "1" ? true : false,
    //                     "username": req.session.login === "1" ? req.session.account : "",
    //                     "active": "index",
    //                     "avatar": avatar,
    //                     "dynamics": req.session.login === "1" ? dynamics : [],
    //                 });
    //                 return;
    //             }
    //             db.find("users", { "username": result2[i].username }, function (err, result3) {
    //                 dynamics.push({...result2[i], avatar: result3[0].avatar || "default.jpg"});
    //                 iterator(i+1);
    //             });
    //         })(0);
    //     })
    // });
    db.find("users", { "username": req.session.login === "1" ? req.session.account : "" }, function (err, result) {
        if (result.length !== 0) {
            avatar = result[0].avatar || "default.jpg";            
        }
        res.render("index", {
            "login": req.session.login === "1" ? true : false,
            "username": req.session.login === "1" ? req.session.account : "",
            "active": "index",
            "avatar": avatar,
        });
    });
}

// 注册页面
exports.showRegister = function (req, res, next) {
    res.render("register", {
        "login": req.session.login === "1" ? true : false,
        "username": req.session.login === "1" ? req.session.account : "",
        "active": "register",
    });
}

// 注册业务
exports.doRegister = function (req, res, next) {
    // 获取账户名和密码
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fileds, files) {
        var username = fileds.account;
        var password = fileds.password;
        // 查询用户名是否重复
        db.find("users", { "username": username }, function (err, result) {
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
                "avatar": "default.jpg"
            }, function (err, result) {
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

// 登录页面
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login === "1" ? true : false,
        "username": req.session.login === "1" ? req.session.account : "",
        "active": "login"
    });
}

// 登录业务
exports.doLogin = function (req, res, next) {
    // 获取账户名和密码
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fileds, files) {
        var username = fileds.account;
        var password = fileds.password;
        // 查询用户名是否存在
        db.find("users", { "username": username }, function (err, result) {
            if (err) {
                res.send("-3");
                return;
            }
            if (result.length == 0) {
                res.send("-1");
                return;
            }
            // 用户名存在，检测用户名密码是否匹配
            // md5加密
            password = md5(md5(password) + "sliver");
            // 登录成功，写入session
            if (result[0].password === password) {
                req.session.login = "1";
                req.session.account = username;
                res.send("1");
                return;
            } else {
                // 密码错误
                res.send("-2");
                return;
            }
        });
    });
}

// 登出业务
exports.doLogout = function (req, res, next) {
    if (req.session.login === "1") {
        req.session.destroy();
        res.redirect('/');
    }
}

// 设置头像页面
exports.showSetAvatar = function (req, res, next) {
    if (req.session.login === "1") {
        res.render("setavatar", {
            "login": true,
            "username": req.session.account,
            "active": "settings"
        });
    } else {
        res.setHeader("Content-Type", "text/plain;charset=utf-8");
        res.end("非法闯入，这个页面要求登录！");
    }
}

// 设置头像业务 - 上传
exports.doSetAvatar = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function (err, fileds, files) {
        var oldPath = files.avatar.path;
        var newPath = path.normalize(__dirname + "/../avatar/" + req.session.account) + '.jpg';
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                res.send("失败");
                return;
            }
            req.session.avatar = req.session.account + '.jpg'
            // 跳转到裁切头像页面
            res.redirect("/cutavatar");
        });
    })
}

// 裁切头像页面
exports.showCutAvatar = function (req, res, next) {
    if (req.session.login === "1") {
        res.render("cutavatar", {
            "login": true,
            "username": req.session.account,
            "avatar": req.session.avatar,
            "active": "settings"
        });
    } else {
        res.setHeader("Content-Type", "text/plain;charset=utf-8");
        res.end("非法闯入，这个页面要求登录！");
    }
}

// 设置头像业务 - 裁切
exports.doCutAvatar = function (req, res, next) {
    //这个页面接收几个GET请求参数
    //文件名、w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (err) {
                res.send("-1");
                return;
            }
            // 更改数据库当前用户的avatar这个值
            db.updateMany("users",
                { "username": req.session.account },
                { $set: { "avatar": req.session.avatar } }, function (err, result) {
                    res.send("1");
                }
            );
        });
}

// 发表动态业务
exports.doPostDynamic = function (req, res, next) {
    // 获取动态内容
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fileds, files) {
        var content = fileds.dynamicContent;
        // 插入该条动态
        db.insertOne("posts", {
            "username": req.session.account,
            "content": content,
            "datetime": new Date(),
        }, function (err, result) {
            if (err) {
                res.send("-3");
                return;
            }
            res.send("1");
        });
    });
}

// 列出所有动态业务 后台分页
exports.doGetAllDynamics = function (req, res, next) {
    var page = req.query.page; 
    db.find("posts", {}, {"pageamount": 9, "page": page, "sort": {"datetime": -1}}, function(err, result) {
        res.json({"dynamics": result});
    });
}

// 获取动态总数
exports.doGetDynamicsAmount = function (req, res, next) {
    db.getAllCount("posts", function(count) {
        res.send(count.toString());
    });
}

// 列出用户信息业务
exports.doGetUserInfo = function (req, res, next) {
    var username = req.query.username;
    db.find("users", {"username": username}, function(err, result) {
        let {password, ...data} = result[0];
        data['avatar'] = result[0].avatar || "default.jpg";  
        res.json({"userInfo": data});
    });
}
