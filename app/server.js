'use strict';

/**
 * MiroTalk BRO - Server component
 *
 * @link    GitHub: https://github.com/miroslavpejic85/mirotalkbro
 * @link    Live demo: https://bro.mirotalk.com
 * @license For open source under AGPL-3.0
 * @license For private project or commercial purposes contact us at: license.mirotalk@gmail.com
 * @author  Miroslav Pejic - miroslav.pejic.85@gmail.com
 * @version 1.0.42
 */

require('dotenv').config();

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const app = express();
const path = require('path');

const ServerApi = require('./api');
const yamlJS = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yamlJS.load(path.join(__dirname + '/api/swagger.yaml'));

const packageJson = require('../package.json');

const logs = require('./logs');
const log = new logs('server');

let server; // This server exposed on http or https (self signed certificate)
const broadcasters = {}; // collect broadcasters grouped by socket.id
const viewers = {}; // collect viewers grouped by socket.id

// Query params example
const broadcast = 'broadcast?id=123&name=Broadcaster';
const viewer = 'viewer?id=123&name=Viewer';
const viewerHome = 'home?id=123';

// Sentry config
const sentryEnabled = getEnvBoolean(process.env.SENTRY_ENABLED);
if (sentryEnabled) {
    const Sentry = require('@sentry/node');
    const { CaptureConsole } = require('@sentry/integrations');
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [new CaptureConsole({ levels: ['warn', 'error'] })],
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE,
    });
    // Test
    // log.error('error');
    // log.warn('warning');
}

// Server
const protocol = process.env.PROTOCOL || 'http';
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3016;
const home = `${protocol}://${host}:${port}`;

// API
const apiKeySecret = process.env.API_KEY_SECRET || 'mirotalkbro_default_secret';
const apiBasePath = '/api/v1'; // api endpoint path
const apiDocs = home + apiBasePath + '/docs'; // api docs

// Stun and Turn iceServers
const iceServers = [];
const stunServerUrl = process.env.STUN_SERVER_URL;
const turnServerUrl = process.env.TURN_SERVER_URL;
const turnServerUsername = process.env.TURN_SERVER_USERNAME;
const turnServerCredential = process.env.TURN_SERVER_CREDENTIAL;
const stunServerEnabled = getEnvBoolean(process.env.STUN_SERVER_ENABLED);
const turnServerEnabled = getEnvBoolean(process.env.TURN_SERVER_ENABLED);
if (stunServerEnabled && stunServerUrl) iceServers.push({ urls: stunServerUrl });
if (turnServerEnabled && turnServerUrl && turnServerUsername && turnServerCredential) {
    iceServers.push({ urls: turnServerUrl, username: turnServerUsername, credential: turnServerCredential });
}

// Ngrok
const ngrok = require('ngrok');
const ngrokEnabled = getEnvBoolean(process.env.NGROK_ENABLED);
const ngrokAuthToken = process.env.NGROK_AUTH_TOKEN;

// Server Listen on
if (protocol === 'http') {
    const http = require('http');
    server = http.createServer(app);
} else {
    const https = require('https');
    const fs = require('fs');
    const options = {
        key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem'), 'utf-8'),
        cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'), 'utf-8'),
    };
    server = https.createServer(options, app);
}

// Cors
let corsOrigin;
if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    try {
        corsOrigin = JSON.parse(process.env.CORS_ORIGIN);
    } catch (error) {
        // If parsing fails, handle the error accordingly
        log.error('Error parsing CORS_ORIGIN:', error.message);
        corsOrigin = '*'; // or set to a default value
    }
} else {
    corsOrigin = '*';
}

const corsOptions = {
    origin: corsOrigin,
    methods: process.env.CORS_METHOD ? JSON.parse(process.env.CORS_METHODS) : ['GET', 'POST'],
};

const io = require('socket.io')(server, {
    cors: corsOptions,
});

// public html files
const html = {
    public: path.join(__dirname, '../', 'public'),
    home: path.join(__dirname, '../', 'public/views/home.html'),
    broadcast: path.join(__dirname, '../', 'public/views/broadcast.html'),
    viewer: path.join(__dirname, '../', 'public/views/viewer.html'),
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json()); // Api parse body data as json
app.use(express.static(html.public));
app.use(apiBasePath + '/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); // api docs

// Logs requests
app.use((req, res, next) => {
    log.debug('New request:', {
        body: req.body,
        method: req.method,
        path: req.originalUrl,
    });
    next();
});

app.post('*', function (next) {
    next();
});

app.get('*', function (next) {
    next();
});

// Remove trailing slashes in url handle bad requests
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError || err.status === 400 || 'body' in err) {
        log.error('Request Error', {
            header: req.headers,
            body: req.body,
            error: err.message,
        });
        return res.status(400).send({ status: 404, message: err.message });
    }
    if (req.path.substr(-1) === '/' && req.path.length > 1) {
        let query = req.url.slice(req.path.length);
        res.redirect(301, req.path.slice(0, -1) + query);
    } else {
        log.debug('New request', {
            // headers: req.headers,
            // body: req.body,
            method: req.method,
            path: req.originalUrl,
        });
        next();
    }
});

app.get(['/'], (req, res) => {
    return res.sendFile(html.home);
});

app.get(['/home'], (req, res) => {
    //http://localhost:3016/home?id=123
    const { id } = req.query;
    return Object.keys(req.query).length > 0 && id ? res.sendFile(html.home) : notFound(res);
});

app.get(['/broadcast'], (req, res) => {
    //http://localhost:3016/broadcast?id=123&name=broadcaster
    const { id, name } = req.query;
    return Object.keys(req.query).length > 0 && id && name ? res.sendFile(html.broadcast) : notFound(res);
});

app.get(['/viewer'], (req, res) => {
    //http://localhost:3016/viewer?id=123&name=viewer
    const { id, name } = req.query;
    return Object.keys(req.query).length > 0 && id && name ? res.sendFile(html.viewer) : notFound(res);
});

app.get(['*'], (req, res) => {
    return notFound(res);
});

// API request join room endpoint
app.post([`${apiBasePath}/join`], (req, res) => {
    const { host, authorization } = req.headers;
    const api = new ServerApi(host, authorization, apiKeySecret);
    if (!api.isAuthorized()) {
        log.debug('MiroTalk get join - Unauthorized', {
            header: req.headers,
            body: req.body,
        });
        return res.status(403).json({ error: 'Unauthorized!' });
    }
    const joinURL = api.getJoinURL(req.body);
    res.json({ join: joinURL });
    log.debug('MiroTalk get join - Authorized', {
        header: req.headers,
        body: req.body,
        join: joinURL,
    });
});

function notFound(res) {
    res.json({ data: '404 not found' });
}

// Socket.io
io.sockets.on('error', (e) => log.error(e));
io.sockets.on('connection', (socket) => {
    socket.on('broadcaster', (broadcastID) => {
        handleBroadcaster(socket, broadcastID);
    });
    socket.on('viewer', (broadcastID, username) => {
        handleViewer(socket, broadcastID, username);
    });
    socket.on('offer', (id, message) => {
        socket.to(id).emit('offer', socket.id, message, iceServers);
    });
    socket.on('answer', (id, message) => {
        socket.to(id).emit('answer', socket.id, message);
    });
    socket.on('candidate', (id, message) => {
        socket.to(id).emit('candidate', socket.id, message);
    });
    socket.on('disconnect', (reason) => {
        handleDisconnect(socket, reason);
    });
});

function handleBroadcaster(socket, broadcastID) {
    // No broadcastID in broadcasters init
    if (!(broadcastID in broadcasters)) broadcasters[broadcastID] = {};
    broadcasters[broadcastID] = socket.id;
    log.debug('Broadcasters', broadcasters);
    sendToBroadcasterViewers(socket, broadcastID, 'broadcaster');
}

function handleViewer(socket, broadcastID, username) {
    // No socket.id in viewers init
    if (!(socket.id in viewers)) viewers[socket.id] = {};
    viewers[socket.id]['broadcastID'] = broadcastID;
    viewers[socket.id]['username'] = username;
    log.debug('Viewers', viewers);
    // From Viewers socket emit to specified broadcaster.id
    socket.to(broadcasters[broadcastID]).emit('viewer', socket.id, iceServers, username);
}

function handleDisconnect(socket, reason) {
    let isViewer = false;
    let isBroadcaster = false;
    // Check if socket disconnected is a viewer, if so, delete it from the viewers list and update the broadcaster
    if (socket.id in viewers) {
        socket
            .to(broadcasters[viewers[socket.id]['broadcastID']])
            .emit('disconnectPeer', socket.id, viewers[socket.id]['username']);
        delete viewers[socket.id];
        isViewer = true;
    }
    // Check if socket disconnected is broadcaster, if so, delete it from the broadcasters lists
    for (let broadcastID in broadcasters) {
        if (broadcasters[broadcastID] == socket.id) {
            delete broadcasters[broadcastID];
            isBroadcaster = true;
            sendToBroadcasterViewers(socket, broadcastID, 'broadcasterDisconnect');
        }
    }
    log.debug('Disconnected', {
        reason: reason,
        id: socket.id,
        isViewer: isViewer,
        isBroadcaster: isBroadcaster,
        viewers: viewers,
        broadcasters: broadcasters,
    });
}

function sendToBroadcasterViewers(socket, broadcastID, message) {
    // From Broadcaster socket emit to all viewers connected to a specified broadcaster.id
    for (let id in viewers) {
        if (viewers[id]['broadcastID'] == broadcastID) socket.to(id).emit(message);
    }
}

function getEnvBoolean(key, force_true_if_undefined = false) {
    if (key == undefined && force_true_if_undefined) return true;
    return key == 'true' ? true : false;
}

async function ngrokStart() {
    try {
        await ngrok.authtoken(ngrokAuthToken);
        await ngrok.connect(port);
        const api = ngrok.getApi();
        const list = await api.listTunnels();
        const tunnelHttps = list.tunnels[0].public_url;
        log.info('Server is running', {
            iceServers: iceServers,
            cors: corsOptions,
            ngrokHome: tunnelHttps,
            ngrokBroadcast: `${tunnelHttps}/${broadcast}`,
            ngrokViewer: `${tunnelHttps}/${viewer}`,
            ngrokViewerHome: `${tunnelHttps}/${viewerHome}`,
            apiDocs: apiDocs,
            apiKeySecret: apiKeySecret,
            nodeVersion: process.versions.node,
            app_version: packageJson.version,
        });
    } catch (err) {
        log.warn('[Error] ngrokStart', err);
        process.exit(1);
    }
}

server.listen(port, () => {
    if (protocol != 'https' && ngrokEnabled && ngrokAuthToken) {
        ngrokStart();
    } else {
        log.info('Server is running', {
            iceServers: iceServers,
            cors: corsOptions,
            home: home,
            broadcast: `${home}/${broadcast}`,
            viewer: `${home}/${viewer}`,
            viewerHome: `${home}/${viewerHome}`,
            apiDocs: apiDocs,
            apiKeySecret: apiKeySecret,
            nodeVersion: process.versions.node,
            app_version: packageJson.version,
        });
    }
});
