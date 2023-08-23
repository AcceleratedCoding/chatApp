const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Store user data (name and private chat info)
const users = {};

// Store messages for private chats
const privateMessages = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Ask for user's name
    socket.emit('request name');

    socket.on('user name', (name) => {
        users[socket.id] = { name, privateChat: null, socketId: socket.id };
        io.emit('user list', Object.values(users));
        privateMessages[socket.id] = {}; // Initialize messages for this user
    });

    // Handle private chat requests
    socket.on('private chat', (targetUserId) => {
        users[socket.id].privateChat = targetUserId;
        if (!privateMessages[socket.id][targetUserId]) {
            privateMessages[socket.id][targetUserId] = []; // Initialize messages for this private chat
        }
        if (!privateMessages[targetUserId]) {
            privateMessages[targetUserId] = {};
        }
        if (!privateMessages[targetUserId][socket.id]) {
            privateMessages[targetUserId][socket.id] = [];
        }
        io.to(socket.id).emit('private messages', privateMessages[socket.id][targetUserId]);
    });

    // Handle private messages
    socket.on('private message', (data) => {
        const sender = users[socket.id];
        const target = users[data.targetUserId];

        if (sender.privateChat === data.targetUserId && target) {
            const message = { text: data.text, senderName: sender.name };
            privateMessages[socket.id][data.targetUserId].push(message);
            privateMessages[data.targetUserId][socket.id].push(message);

            io.to(data.targetUserId).emit('private message', message);
            io.to(socket.id).emit('private message', message);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        delete privateMessages[socket.id];
        io.emit('user list', Object.values(users));
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
