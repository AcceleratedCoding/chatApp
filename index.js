const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Store user data (name and socket ID)
const users = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('request name');

    socket.on('user name', (name) => {
        users[socket.id] = { name };
        io.emit('user list', Object.values(users));
    });

    socket.on('chat message', (msg) => {
        const user = users[socket.id];
        io.emit('chat message', { text: msg, userId: socket.id, userName: user.name });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', Object.values(users));
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
