const container = document.querySelector(".content");
const WaitingResponse = document.createElement("div");
const MessageRow = document.createElement("div");

let whoIm = null;
let messages = [];
console.log(messages);

async function carregarWhoIm() {
  if (whoIm) return whoIm;
  const response = await fetch("./pitaya.JSON");
  if (!response.ok) throw new Error("pitaya.JSON não encontrado");
  whoIm = await response.json();
  return whoIm;
}

const welcome = document.createElement("div");
container.style.justifyContent = "center";
welcome.classList.add("welcome");
welcome.innerHTML = "Hey Lucas, ready to dive in?";
container.appendChild(welcome);

let executed = true;

function greetins() {
  if (executed) {
    container.removeChild(welcome);
    container.style.justifyContent = "flex-start";
    executed = false;
  }
}

// Envia mensagem do usuário na tela
async function sendMessage() {
  const input = document.getElementById("input");
  const texto = input.value.trim();

  if (!texto) return;

  greetins();
  const messageRow = document.createElement("div");
  const userDiv = document.createElement("div");
  const avatar = document.createElement("div");
  messageRow.classList.add("message-row-user");
  container.appendChild(messageRow);
  avatar.classList.add("avatar");
  avatar.innerHTML = "You";
  messageRow.appendChild(userDiv);
  messageRow.appendChild(avatar);
  userDiv.classList.add("user-message");
  userDiv.innerHTML = texto;
  if (shouldAutoScroll()) {
    container.scrollTop = container.scrollHeight;
  }
  clearInput();

  dots();
  setTimeout(() => handleChat(texto), 800);
}

let waitingResponseDiv = null;
function dots() {
    waitingResponseDiv = document.createElement("div");
    waitingResponseDiv.classList.add("dots");
    const dot1 = document.createElement("span");
    const dot2 = document.createElement("span");
    const dot3 = document.createElement("span");
    dot1.classList.add("dot");
    dot2.classList.add("dot");
    dot3.classList.add("dot");
    dot1.innerHTML = "•";
    dot2.innerHTML = "•";
    dot3.innerHTML = "•";
    waitingResponseDiv.appendChild(dot1);
    waitingResponseDiv.appendChild(dot2);
    waitingResponseDiv.appendChild(dot3);
    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.innerHTML = "Pita";
    const messageRow = document.createElement("div");
    messageRow.classList.add("message-row-bot");
    messageRow.classList.add("waiting-response");
    messageRow.appendChild(avatar);
    messageRow.appendChild(waitingResponseDiv);
    container.appendChild(messageRow);
}

// Lógica principal do chat com Groq
async function handleChat(texto) {
  const whoImData = await carregarWhoIm();

  // Primeira vez → adiciona o system prompt correto
  if (messages.length === 0) {
    messages.push({
      role: "system",
      content: whoImData.system_prompt,
    });
  }

  // Adiciona mensagem do usuário no histórico
  messages.push({
    role: "user",
    content: texto,
  });

  // Chama a API da Groq
  const botResponse = await getBotResponse();

  // Mostra resposta da Pitaya
  sendBotMessage(botResponse);
  container.removeChild(document.querySelector(".waiting-response"));
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
        messages: messages, // agora com histórico completo
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

  // Salva resposta no histórico
  messages.push({
    role: "assistant",
    content: resposta,
  });

  return resposta;
}

function shouldAutoScroll() {
  const threshold = 100;
  return (
    container.scrollHeight - container.scrollTop - container.clientHeight <
    threshold
  );
}

function sendBotMessage(botMenssage) {
  const botDiv = document.createElement("div");
  const avatar = document.createElement("div");
  const messageRow = document.createElement("div");
  messageRow.classList.add("message-row-bot");
  container.appendChild(messageRow);
  avatar.classList.add("avatar");
  avatar.innerHTML = "Pita";
  messageRow.appendChild(avatar);
  messageRow.appendChild(botDiv);
  botDiv.classList.add("bot-message"); // deixa à esquerda

  botDiv.innerHTML = mdToHtml(botMenssage);
  if (shouldAutoScroll()) {
    container.scrollTop = container.scrollHeight;
  }
}

// Markdown simples corrigido
function mdToHtml(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // italic
    .replace(/`(.*?)`/g, "<code>$1</code>"); // code
}


function clearInput() {
  document.getElementById("input").value = "";
}

function pulseVideo() {
  const video = document.querySelector("video");
  if (video) {
    video.style.animation = "pulse 3s 2";
    // remove a animação depois
    setTimeout(() => {
      video.style.animation = "";
    }, 6000);
  }
}
