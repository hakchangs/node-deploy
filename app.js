const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const helmet = require('helmet');
const hpp = require('hpp');
require('dotenv').config();

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport');
const logger = require('./logger');

const app = express();
sequelize.sync();
passportConfig(passport);

// view 경로와 템플릿 파싱 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// 포트 설정
app.set('port', process.env.PORT || 8001);

///////////////////////////////
// 미들웨어 설정 시작
///////////////////////////////

// 로그 추가
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.use(helmet());
    app.use(hpp());
} else {
    app.use(morgan('dev'));
}
// 정적자원 저장경로 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
// json 파서 추가
app.use(express.json());
// URL인코딩 파서 추가
app.use(express.urlencoded({ extended: false }));
// 쿠키 파서 추가
app.use(cookieParser(process.env.COOKIE_SECRET));
// 세션 설정
const sessionOption = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
};
if (process.env.NODE_ENV === 'production') {
    sessionOption.proxy = true;
    // sessionOption.cookie.secret = true;
}
app.use(session(sessionOption));
// flash 추가
app.use(flash());
// 패스포트 초기화
app.use(passport.initialize());
app.use(passport.session());

// 라우터 추가
app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);

// 404 예외처리
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    logger.info('hello');
    logger.error(error.message);
    next(error);
});

// 모든 예외를 처리하여 응답을 내려줌
app.use((error, req, res, next) => {
    res.locals.message = error.message;
    res.locals.error = req.app.get('env') === 'development' ? error : {};
    res.status(error.status || 500);
    res.render('error');
});

// http 서버 시작
app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});