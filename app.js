var express = require("express");
var app = express();
var router = require("./router/router")
var session = require('express-session');

// 模板引擎
app.set("view engine", "ejs");

// 静态资源
app.use(express.static("./public"))

// session设置
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));
// 路由表
app.get("/", router.showIndex);
app.get("/register", router.showRegister);
app.post("/doregister", router.doRegister);
app.get("/login", router.showLogin);
app.post("/dologin", router.doLogin);
app.get("/dologout", router.doLogout);

app.listen(3000);