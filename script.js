(() => {
  const loginEl = document.getElementById('login');
  const chatEl = document.getElementById('chat');
  const messagesEl = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const statusEl = document.getElementById('status');
  const nameInput = document.getElementById('nameInput');
  const passwordInput = document.getElementById('passwordInput');
  const startBtn = document.getElementById('startBtn');
  const emojiBtn = document.getElementById('emoji-button');
  const sendBtn = document.getElementById('sendBtn');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeIcon = document.getElementById('volume-icon');

  let picker;
  let notificationSound = new Audio('notification-sound.mp3');
  notificationSound.loop = false;

  volumeSlider.addEventListener('input', (e) => {
    notificationSound.volume = e.target.value;
    updateVolumeIcon(e.target.value);
  });

  const initEmojiPicker = () => {
    if (typeof EmojiButton !== 'undefined') {
      picker = new EmojiButton();
      picker.on('emoji', emoji => {
        messageInput.value += emoji;
      });
    } else {
      console.error('EmojiButton is not loaded correctly.');
    }
  };

  window.addEventListener('load', () => {
    initEmojiPicker();
  });

  emojiBtn.addEventListener('click', () => {
    if (picker) {
      picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiBtn);
    }
  });

  let localName = '';

  const correctHash = '$argon2id$v=19$m=32768,t=3,p=4$bXlzZWNyZXRzYWx0$W46bMUQKJUIqu7e/4ElWtcqyQIFw/ggUV7bXPmosU/k';

  startBtn.onclick = async () => {
    const enteredPassword = passwordInput.value.trim();

    if (!nameInput.value.trim()) {
      alert('Enter your name');
      return;
    }

    if (!enteredPassword) {
      alert('Enter your password');
      return;
    }

    try {
      if (typeof argon2 === 'undefined') {
        alert('A library failed to load!');
        return;
      }

      const result = await argon2.verify({
        pass: enteredPassword,
        encoded: correctHash
      });

      if (result === false) {
        alert('Wrong credentials');
        return;
      }

      localName = nameInput.value.trim();
      loginEl.style.display = 'none';
      chatEl.style.display = 'flex';
      statusEl.textContent = 'Connected';

      setInterval(fetchChatHistory, 250);
    } catch (err) {
      alert('Wrong credentials');
    }
  };

  sendBtn.addEventListener('click', sendMessage);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (loginEl.style.display !== 'none') {
        startBtn.click();
      } else if (chatEl.style.display !== 'none') {
        e.preventDefault();
        sendMessage();
      }
    }
  });

  let lastHistorySize = 0;
  let lastMessageSender = '';

  function fetchChatHistory() {
    fetch('/chat-history')
      .then(response => response.text())
      .then(data => {
        const messageLines = data.trim().split('\n');

        if (messageLines.length > lastHistorySize) {
          const lastMessage = messageLines[messageLines.length - 1];
          const sender = lastMessage.split(':')[0];

          if (sender !== localName) {
            notificationSound.play();
          }

          lastHistorySize = messageLines.length;
        }

        const messages = messageLines.map(msg => {
          const isFromYou = msg.startsWith(localName + ':');
          return `<div class="msg ${isFromYou ? 'you' : 'partner'}">${msg}</div>`;
        }).join('');
        
        messagesEl.innerHTML = messages;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      })
      .catch(err => {
        console.error('Error fetching chat history:', err);
      });
  }

  function sendMessage() {
    const message = messageInput.value.trim();

    if (message) {
      const messageWithName = `${localName}: ${message}`;
      addMessageToChat(messageWithName);
      messageInput.value = '';

      fetch('/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageWithName }),
      }).catch(err => {
        console.error('Error sending message', err);
      });
    }
  }

  function addMessageToChat(message) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('msg', 'you');
    msgEl.textContent = message;
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateVolumeIcon(volume) {
    if (volume > 0.5) {
      volumeIcon.textContent = '🔊';
    } else if (volume > 0) {
      volumeIcon.textContent = '🔉';
    } else {
      volumeIcon.textContent = '🔇';
    }
  }
})();
