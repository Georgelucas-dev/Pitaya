const output = document.getElementById('typing-area');
const input = document.getElementById('input');

const API_BASE = "http://localhost:3000/api/chat";
let conversationId = null;

async function initConversation() {
  const saved = localStorage.getItem("pitaya_conversation_id");

  if (saved) {
    conversationId = saved;
    return;
  }

  const response = await fetch(`${API_BASE}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona: "pitaya" }),
  });

  const data = await response.json();
  conversationId = data.conversationId;
  localStorage.setItem("pitaya_conversation_id", conversationId);
}


function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function addLine(cls, text) {
  const d = document.createElement('div');
  d.className = 'line ' + cls;
  d.innerHTML = text;
  output.appendChild(d);
  document.getElementById('output').scrollTop = output.scrollHeight;
}

function typeLines(lines, idx = 0) {
  if (idx >= lines.length) return;
  const { cls, text } = lines[idx];
  addLine(cls, text);
  setTimeout(() => typeLines(lines, idx + 1), 80);
}

const spinFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinInterval = null;

function startSpinner() {
  const wrapper = document.createElement('div');
  wrapper.className = 'line spinner-line';
  wrapper.id = 'spinner';
  const spin = document.createElement('span');
  spin.className = 'spin-char';
  spin.textContent = spinFrames[0];
  const lbl = document.createElement('span');
  lbl.className = 'c-muted';
  lbl.style.fontSize = '13px';
  lbl.textContent = 'pitaya está pensando...';
  wrapper.appendChild(spin);
  wrapper.appendChild(lbl);
  output.appendChild(wrapper);
  let f = 0;
  spinInterval = setInterval(() => {
    f = (f + 1) % spinFrames.length;
    spin.textContent = spinFrames[f];
  }, 80);
  document.getElementById('output').scrollTop = output.scrollHeight;
}

function stopSpinner() {
  clearInterval(spinInterval);
  const s = document.getElementById('spinner');
  if (s) s.remove();
}

async function sendMessage() {
  const texto = input.value.trim();
  if (!texto) return;

  if (texto.startsWith('/title ')) {
    input.value = '';
    const title = texto.slice(7).trim();
    await fetch(`${API_BASE}/${conversationId}/title`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    addLine('c-green', `  conversa nomeada: "${title}"`);
    addLine('', '');
    return;
  }

  if (texto.startsWith('/rm')) {
    const arg = texto.slice(3).trim();
    const targetId = arg || conversationId;

    await fetch(`${API_BASE}/${targetId}`, { method: "DELETE" });

    if (targetId == conversationId) {
      localStorage.removeItem("pitaya_conversation_id");
      conversationId = null;
      await initConversation();
      addLine('c-green', '  conversa atual deletada. nova sessão iniciada.');
    } else {
      addLine('c-green', `  conversa [${targetId}] deletada.`);
    }

    addLine('', '');
    return;
  }

  if (texto === '/convos') {
    const response = await fetch(`${API_BASE}/convos`);
    const data = await response.json();

    addLine('', `<span class="tag-ai c-purple">pitaya</span> <span class="c-muted">${now()}</span>`);
    addLine('c-green', '  conversas anteriores:');

    data.conversations.forEach(c => {
      const date = new Date(c.created_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const title = c.title || '(sem título)';
      addLine('c-muted', `  [${c.id}] ${title} · ${date}`);
    });

    addLine('', '');
    return;
  }

  input.value = '';

  addLine('', '');
  addLine('', `<span class="tag-user c-blue">you</span>   <span class="c-muted">${now()}</span>`);
  addLine('c-white', `  ${texto}`);
  addLine('', '');

  if (texto === '/clear') {
    output.innerHTML = '';
    addLine('c-green', '  terminal limpo.');
    addLine('', '');
    return;
  }

  if (texto === '/help') {
    addLine('', `<span class="tag-ai c-purple">pitaya</span> <span class="c-muted">${now()}</span>`);
    addLine('c-green', '  comandos disponíveis:');
    addLine('c-muted', '  /help           · lista de comandos');
    addLine('c-muted', '  /clear          · limpa o terminal');
    addLine('c-muted', '  /title <nome>   · nomeia a conversa atual');
    addLine('c-muted', '  /convos         · lista conversas anteriores');
    addLine('c-muted', '  /rm            · deleta a conversa atual');
    addLine('c-muted', '  /rm <id>       · deleta uma conversa específica');
    addLine('', '');
    return;
  }

  startSpinner();

  setTimeout(async () => {
    stopSpinner();
    await handleChat(texto);
  }, 900 + Math.random() * 500);
}

async function handleChat(texto) {
  try {
    const response = await fetch(`${API_BASE}/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: texto }),
    });

    const data = await response.json();

    if (data.audio) {
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    }

    sendBotMessage(data.reply);
  } catch (err) {
    sendBotMessage("Que ódio, deu um erro aqui 😭 tenta de novo");
    console.error(err);
  }
}

function sendBotMessage(botMessage) {
  addLine('', '');
  addLine('', `<span class="tag-ai c-purple">pitaya</span> <span class="c-muted">${now()}</span>`);
  const lines = botMessage.split('\n').map(line => ({
    cls: 'c-white',
    text: '  ' + mdToHtml(line)
  }));
  typeLines(lines);
  setTimeout(() => addLine('', ''), lines.length * 80 + 100);
}

function mdToHtml(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

initConversation();