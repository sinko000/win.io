const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/')));

// Basit kullanıcı veritabanı (hafızada tutulur)
let users = {}; // { username: password }
let players = {}; // { socketId: { username, x, y, color } }

io.on('connection', (socket) => {
    console.log(`Bir bağlantı sağlandı: ${socket.id}`);

    // Kayıt olma isteği
    socket.on('register', (data) => {
        if (users[data.username]) {
            socket.emit('authResponse', { success: false, message: 'Bu kullanıcı adı zaten alınmış!' });
        } else {
            users[data.username] = data.password;
            socket.emit('authResponse', { success: true, message: 'Kayıt başarılı! Şimdi giriş yapabilirsin.' });
        }
    });

    // Giriş yapma isteği
    socket.on('login', (data) => {
        if (users[data.username] && users[data.username] === data.password) {
            socket.emit('authResponse', { success: true, username: data.username });
        } else {
            socket.emit('authResponse', { success: false, message: 'Hatalı kullanıcı adı veya şifre!' });
        }
    });

    // Oyuna giriş yapıldığında
    socket.on('joinGame', (username) => {
        players[socket.id] = {
            id: socket.id,
            username: username,
            x: Math.random() * 600 + 100,
            y: Math.random() * 400 + 100,
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
        };
        io.emit('updatePlayers', players);
    });

    // Hareket etme
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('updatePlayers', players);
        }
    });

    // Chat mesajı
    socket.on('chatMessage', (msg) => {
        if (players[socket.id]) {
            io.emit('chatMessage', { username: players[socket.id].username, text: msg });
        }
    });

    // Çıkış yapma
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('updatePlayers', players);
        }
        console.log(`Bağlantı koptu: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
