require('dotenv').config();
var express = require('express');
var app = express();
var cors = require('cors');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');

var indexRouter = require('./routers/index');
var authRouter = require('./routers/auth');
var chudeRouter = require('./routers/chude');
var taikhoanRouter = require('./routers/taikhoan');
var baivietRouter = require('./routers/baiviet');
// var weatherRouter = require('./routers/weather');

var uri = process.env.MONGO_DB_URI;
mongoose.connect(uri).catch(err => console.log(err));

app.use(cors());

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'public')));

app.use(session({
	name: 'iNews',                      // Tên session (tự chọn)
	secret: 'Black cat eat black mouse',// Khóa bảo vệ (tự chọn)
	resave: true,
	saveUninitialized: true,
	cookie: {
		maxAge: 30 * 86400000           // 30 * (24 * 60 * 60 * 1000) - Hết hạn sau 30 ngày
	}
}));

app.use((req, res, next) => {
	res.locals.session = req.session;

	// Lấy thông báo (lỗi, thành công) của trang trước đó (nếu có)
	var error = req.session.error;
	var success = req.session.success;

	// Xóa thông báo (lỗi, thành công) cũ
	delete req.session.error;
	delete req.session.success;

	res.locals.errorMsg = '';
	res.locals.successMsg = '';

	// Gán thông báo (lỗi, thành công) mới
	if (error) res.locals.errorMsg = error;
	if (success) res.locals.successMsg = success;

	next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/chude', chudeRouter);
app.use('/taikhoan', taikhoanRouter);
app.use('/baiviet', baivietRouter);
// app.use('/weather', weatherRouter);

var PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log('Sever is running...');
});