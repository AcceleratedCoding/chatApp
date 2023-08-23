const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Store user data (name and private chat info)
const users = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Ask for user's name
    socket.emit('request name');

    socket.on('user name', (name) => {
        users[socket.id] = { name, privateChat: null, socketId: socket.id };
        io.emit('user list', Object.values(users));
    });

    // Handle private chat requests
    socket.on('private chat', (targetUserId) => {
        users[socket.id].privateChat = targetUserId;
    });

    // Handle private messages
    socket.on('private message', (data) => {
        const sender = users[socket.id];
        const target = users[data.targetUserId];

        if (sender.privateChat === data.targetUserId && target) {
            io.to(data.targetUserId).emit('private message', {
                text: data.text,
                senderName: sender.name,
            });

            io.to(socket.id).emit('private message', {
                text: data.text,
                senderName: sender.name,
            });
        }
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
