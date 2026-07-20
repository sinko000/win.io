const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Frontend dosyalarını sunmak için public klasörünü aktif et
app.use(express.static(path.join(__dirname, 'public')));

let players = {};

io.on('connection', (socket) => {
    console.log(`Bir oyuncu bağlandı: ${socket.id}`);

    // Yeni oyuncuyu rastgele bir renkle kaydet
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 100,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        score: 100
    };

    // Tüm oyunculara güncel oyuncu listesini gönder
    io.emit('updatePlayers', players);

    // Oyuncu haritada tıkladığında veya hamle yaptığında
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('updatePlayers', players);
        }
    });

    // Oyuncu ayrıldığında
    socket.on('disconnect', () => {
        console.log(`Oyuncu ayrıldı: ${socket.id}`);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
