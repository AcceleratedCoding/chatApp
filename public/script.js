$(function () {
    const socket = io();
    let currentChatUser = null;
    let userName = '';

    // Prompt user for name until a name is entered
    while (!userName) {
        userName = prompt('Please enter your name:');
    }

    socket.emit('user name', userName);
    $('#currentUserName').text(userName);

    // Update connected user list
    socket.on('user list', function (users) {
        $('#userList').empty();
        users.forEach(user => {
            if (user.socketId !== socket.id) {
                const listItem = $('<li>').text(user.name).data('userId', user.socketId);
                if (user.socketId === currentChatUser) {
                    listItem.addClass('selected');
                }
                $('#userList').append(listItem);
            }
        });
    });

    // Handle user selection for private chat
    $('#userList').on('click', 'li', function () {
        const targetUserId = $(this).data('userId');
        currentChatUser = targetUserId;
        $('#userList li').removeClass('selected');
        $(this).addClass('selected');
        $('#currentChatUser').text($(this).text());
        $('#chatMessages').empty();
        socket.emit('private chat', targetUserId);
    });

    // Send private messages
    $('#sendButton').click(function () {
        const rawMessage = $('#input').val();
        if (['/help', '/clear', '/random'].includes(rawMessage.trim())) {
            if (rawMessage == '/help') {
                document.getElementById("modal").style.display = "block";
            } else if (rawMessage == '/clear') {
                $('#chatMessages').empty();
            } else {
                $('#chatMessages').append($('<div class="message">').text(`Here's your random number ${Math.random()}`));
            }
            $('#input').val('');
        } else {
            if (!currentChatUser) {
                alert('Please select a user to chat with.');
                return;
            }
            if (rawMessage) {
                const senderName = $('#currentUserName').text();
                const message = replaceEmojis(rawMessage);
                socket.emit('private message', { targetUserId: currentChatUser, text: message });
                $('#chatMessages').append($('<div class="message">').text(`${senderName}: ${message}`));
                $('#input').val('');
            }
        }

    });

    // Display private messages in both sender and receiver chat areas
    socket.on('private message', function (data) {
        if (data.senderName === $('#currentChatUser').text()) {
            $('#chatMessages').append($('<div class="message">').text(`${data.senderName}: ${data.text}`));
        }
    });

    // Display private messages when switching chats
    socket.on('private messages', function (messages) {
        $('#chatMessages').empty();
        messages.forEach(message => {
            $('#chatMessages').append($('<div class="message">').text(`${message.senderName}: ${message.text}`));
        });
    });

    // Function to replace emojis
    function replaceEmojis(text) {
        text = text.replace(/hey/gi, '🙋‍♂️');
        text = text.replace(/react/gi, '⚛️');
        text = text.replace(/woah/gi, '😲');
        text = text.replace(/lol/gi, '😂');
        text = text.replace(/like/gi, '❣️');
        text = text.replace(/congratulations/gi, '🎉');
        return text;
    }
});

document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "none";
});

window.addEventListener("click", function (event) {
    if (event.target === document.getElementById("modal")) {
        document.getElementById("modal").style.display = "none";
    }
});