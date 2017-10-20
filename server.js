'use strict';

const path = require('path');
const zlib = require('zlib');
const winston = require('winston');
const Koa = require('koa');
const Router = require('koa-router');
const koaLogger = require('winston-koa-logger');
const convert = require('koa-convert');
const compress = require('koa-compress');
const staticFiles = require('koa-static');
const body = require('koa-body');
const json = require('koa-json');
const cors = require('koa-cors');
const views = require('koa-views');
const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const env = {
    name: require('./package').name,
    mode: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
}

mongoose.Promise = global.Promise;


class Views {
    async index(ctx) {
        return await ctx.render('index.html')
    }
}


function startDB() {
    let uri = `mongodb://localhost:27017/${env.mode}-test`;
    mongoose.connection.on('error', function(error) {
        console.error(`Failed to connect to MongoDB (mongod)`);
        process.exit(-1);
    });
    process.on('SIGINT', function () {
        mongoose.connection.close(function() {
            process.exit(0);
        });
    });
    mongoose.connect(uri, { useMongoClient: true });
}


function hookupModel() {
    mongoose.model('User', new Schema({
        name: String,
        email: String,
        pasword: String
    }));
    mongoose.model('Project', new Schema({
        name: String,
        description: String,
    }, {strict: false }));
}


function getRouter(views) {
    const router = new Router();
    router.get('/', views.index);
    return router;
}


async function startServer(router) {
    const app = new Koa();
    app.use(convert(koaLogger(new winston.Logger({
        level: 'debug',
        transports:
            new (winston.transports.Console)({
                timestamp: true,
                colorize: true
            })
        ],
    }))));
    app.use(compress({ flush: zlib.Z_SYNC_FLUSH }));
    app.use(body({ multipart: true }));
    app.use(convert(staticFiles(path.join(__dirname, 'public'))));
    app.use(convert(json({
        pretty: /production/.test(env.mode)? false: true,
        param: 'pretty'
    })));
    app.use(convert(cors()));
    app.use(views(path.join(__dirname, 'views'), { map: { html: 'nunjucks' }}));
    app.use(router.routes());
    app.use(router.allowedMethods());
    await app.listen(env.port);
    console.log(`${env.name} is listening port ${env.port} (${env.mode} mode)`);
    return app;
}


async function main() {
    startDB();
    hookupModel();
    const views = new Views();
    const router = getRouter(views);
    return await startServer(router);
}


main();