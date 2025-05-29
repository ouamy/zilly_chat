const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const chatHistoryFile = path.join(__dirname, 'chat_history.txt');

app.use(express.static(path.join(__dirname, '')));

app.use(express.json());

app.get('/chat-history', (req, res) => {
          fs.readFile(chatHistoryFile, 'utf8', (err, data) => {
                      if (err) {
                                    return res.status(500).send('Error reading chat history');
                                  }
                      res.send(data);
                    });
});

app.post('/send-message', (req, res) => {
          const { message } = req.body;
          const newMessage = `${message}\n`;

          fs.appendFile(chatHistoryFile, newMessage, (err) => {
                      if (err) {
                                    return res.status(500).send('Error saving message');
                                  }
                      res.send('Message saved');
                    });
});

app.listen(3000, () => console.log('Server running on port 3000'));