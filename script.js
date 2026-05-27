const output = document.getElementById('typing-area');
const input = document.getElementById('input');

let whoIm = null;
let messages = [];

async function carregarWhoIm() {
  if (whoIm) return whoIm;
  const response = await fetch("./pitaya.JSON");
  if (!response.ok) throw new Error("pitaya.JSON não encontrado");
  whoIm = await response.json();
  return whoIm;
}

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function addLine(cls, text) {
  const d = document.createElement('div');
  d.className = 'line ' + cls;
  d.innerHTML = text;
  output.appendChild(d);
  const outputDiv = document.getElementById('output');
  outputDiv.scrollTop = outputDiv.scrollHeight;
}

function typeLines(lines, idx = 0) {
  if (idx >= lines.length) return;
  const { cls, text } = lines[idx];
  addLine(cls, text);
  setTimeout(() => typeLines(lines, idx + 1), 80);
}

const spinFrames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
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
  
  const outputDiv = document.getElementById('output');
  outputDiv.scrollTop = outputDiv.scrollHeight;
}

function stopSpinner() {
  clearInterval(spinInterval);
  const s = document.getElementById('spinner');
  if (s) s.remove();
}

async function sendMessage() {
  const texto = input.value.trim();
  if (!texto) return;

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
    addLine('c-muted', '  /help    · lista de comandos');
    addLine('c-muted', '  /clear   · limpa o terminal');
    addLine('', '');
    return;
  }

  startSpinner();

  const delay = 900 + Math.random() * 500;
  setTimeout(() => {
    stopSpinner();
    handleChat(texto);
  }, delay);
}

async function handleChat(texto) {
  const whoImData = await carregarWhoIm();

  if (messages.length === 0) {
    messages.push({
      role: "system",
      content: whoImData.system_prompt,
    });
  }

  messages.push({
    role: "user",
    content: texto,
  });

  const botResponse = await getBotResponse();
  sendBotMessage(botResponse);
}

async function getBotResponse() {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer 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",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.9,
        max_tokens: 1024,
      }),
    },
  );

  if (!response.ok) {
    console.error("Erro na API Groq:", await response.text());
    return "Que ódio, deu um erro aqui 😭 tenta de novo";
  }

  const data = await response.json();
  const resposta = data.choices[0].message.content;

  messages.push({
    role: "assistant",
    content: resposta,
  });

  return resposta;
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
