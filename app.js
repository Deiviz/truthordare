const players = ["Jugador 1", "Jugador 2"];

const state = {
  currentPlayerIndex: 0,
  scores: [0, 0],
  decks: {
    truth: [],
    dare: []
  },
  discard: {
    truth: [],
    dare: []
  },
  activeCard: null
};

const elements = {
  splashScreen: document.querySelector("#splash-screen"),
  setupScreen: document.querySelector("#setup-screen"),
  gameScreen: document.querySelector("#game-screen"),
  startButton: document.querySelector("#start-button"),
  playerForm: document.querySelector("#player-form"),
  playerInputs: [
    document.querySelector("#player-1-input"),
    document.querySelector("#player-2-input")
  ],
  currentPlayer: document.querySelector("#current-player"),
  playerNames: [
    document.querySelector("#player-1-name"),
    document.querySelector("#player-2-name")
  ],
  playerChips: [
    document.querySelector("#player-1-chip"),
    document.querySelector("#player-2-chip")
  ],
  playerCounts: [
    document.querySelector("#player-1-count"),
    document.querySelector("#player-2-count")
  ],
  card: document.querySelector("#game-card"),
  cardSymbol: document.querySelector("#card-symbol"),
  cardKind: document.querySelector("#card-kind"),
  cardTitle: document.querySelector("#card-title"),
  cardText: document.querySelector("#card-text"),
  truthButton: document.querySelector("#truth-button"),
  dareButton: document.querySelector("#dare-button"),
  truthCount: document.querySelector("#truth-count"),
  dareCount: document.querySelector("#dare-count"),
  nextButton: document.querySelector("#next-button"),
  resetButton: document.querySelector("#reset-button")
};

async function loadDecks() {
  const [truths, dares] = await Promise.all([
    fetch("data/truths.json").then((response) => response.json()),
    fetch("data/dares.json").then((response) => response.json())
  ]);

  state.decks.truth = shuffle([...truths]);
  state.decks.dare = placeCardAtDraw(shuffle([...dares]), "dare-010", 10);
  updateUi();
}

function shuffle(cards) {
  return cards
    .map((card) => ({ card, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ card }) => card);
}

function placeCardAtDraw(cards, cardId, drawNumber) {
  const cardIndex = cards.findIndex((card) => card.id === cardId);

  if (cardIndex === -1 || drawNumber < 1 || drawNumber > cards.length) {
    return cards;
  }

  const [fixedCard] = cards.splice(cardIndex, 1);
  cards.splice(cards.length - drawNumber + 1, 0, fixedCard);
  return cards;
}

function drawCard(deckName) {
  if (state.decks[deckName].length === 0) {
    state.decks[deckName] = shuffle(state.discard[deckName]);
    state.discard[deckName] = [];
  }

  const card = state.decks[deckName].pop();
  state.activeCard = card;
  renderCard(card);
  updateUi();
}

function renderCard(card) {
  const currentPlayer = players[state.currentPlayerIndex];
  const otherPlayer = players[getOtherPlayerIndex()];
  const typeLabel = card.type === "truth" ? "Verdad" : "Reto";

  elements.card.classList.toggle("truth-card", card.type === "truth");
  elements.card.classList.toggle("dare-card", card.type === "dare");
  elements.cardSymbol.textContent = card.type === "truth" ? "?" : "!";
  elements.cardKind.textContent = `${typeLabel} para ${currentPlayer}`;
  elements.cardTitle.textContent = typeLabel;
  elements.cardText.textContent = formatCardText(card.text, currentPlayer, otherPlayer);
  elements.nextButton.disabled = false;
}

function formatCardText(text, currentPlayer, otherPlayer) {
  return text
    .replaceAll("Jugador actual", currentPlayer)
    .replaceAll("el otro jugador", otherPlayer)
    .replaceAll("otro jugador", otherPlayer)
    .replaceAll("Ambos jugadores", `${players[0]} y ${players[1]}`);
}

function completeCard() {
  if (!state.activeCard) {
    return;
  }

  const deckName = state.activeCard.type;
  state.discard[deckName].push(state.activeCard);
  state.scores[state.currentPlayerIndex] += 1;
  state.activeCard = null;
  state.currentPlayerIndex = getOtherPlayerIndex();

  elements.card.classList.remove("truth-card", "dare-card");
  elements.cardSymbol.textContent = ">";
  elements.cardKind.textContent = "Siguiente turno";
  elements.cardTitle.textContent = players[state.currentPlayerIndex];
  elements.cardText.textContent = "Elige Verdad o Reto para sacar una carta nueva.";
  elements.nextButton.disabled = true;
  updateUi();
}

function resetGame() {
  state.currentPlayerIndex = 0;
  state.scores = [0, 0];
  state.discard.truth = [];
  state.discard.dare = [];
  state.activeCard = null;

  elements.card.classList.remove("truth-card", "dare-card");
  elements.cardSymbol.textContent = "?";
  elements.cardKind.textContent = "Elige una baraja";
  elements.cardTitle.textContent = "Verdad o reto";
  elements.cardText.textContent = "Pulsa una carta para empezar. El turno cambiara automaticamente despues de completar cada carta.";
  elements.nextButton.disabled = true;

  loadDecks();
}

function showScreen(screenName) {
  elements.splashScreen.classList.toggle("active", screenName === "splash");
  elements.setupScreen.classList.toggle("active", screenName === "setup");
  elements.gameScreen.classList.toggle("active", screenName === "game");
}

function startSetup() {
  showScreen("setup");
  elements.playerInputs[0].focus();
}

function startGame(event) {
  event.preventDefault();

  players[0] = cleanPlayerName(elements.playerInputs[0].value, "Jugador 1");
  players[1] = cleanPlayerName(elements.playerInputs[1].value, "Jugador 2");
  resetGame();
  showScreen("game");
}

function cleanPlayerName(value, fallback) {
  const name = value.trim();
  return name.length > 0 ? name : fallback;
}

function getOtherPlayerIndex() {
  return state.currentPlayerIndex === 0 ? 1 : 0;
}

function updateUi() {
  elements.currentPlayer.textContent = players[state.currentPlayerIndex];

  elements.playerChips.forEach((chip, index) => {
    chip.classList.toggle("active", index === state.currentPlayerIndex);
    elements.playerNames[index].textContent = players[index];
    elements.playerCounts[index].textContent = state.scores[index];
  });

  elements.truthCount.textContent = formatCount(state.decks.truth.length);
  elements.dareCount.textContent = formatCount(state.decks.dare.length);
}

function formatCount(count) {
  return count === 1 ? "1 carta" : `${count} cartas`;
}

elements.startButton.addEventListener("click", startSetup);
elements.playerForm.addEventListener("submit", startGame);
elements.truthButton.addEventListener("click", () => drawCard("truth"));
elements.dareButton.addEventListener("click", () => drawCard("dare"));
elements.nextButton.addEventListener("click", completeCard);
elements.resetButton.addEventListener("click", resetGame);

loadDecks().catch(() => {
  elements.cardKind.textContent = "Error";
  elements.cardTitle.textContent = "No se pudieron cargar las cartas";
  elements.cardText.textContent = "Abre el juego desde un servidor local para que el navegador pueda leer los archivos JSON.";
});
