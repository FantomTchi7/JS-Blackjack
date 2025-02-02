class BlackjackGame {
    constructor() {
        this.deck = [];
        this.dealerHand = [];
        this.playerHand = [];
        this.gameInProgress = false;
        this.cardWidth = 169.075;
        this.cardHeight = 244.640;
        this.maxHandWidth = 0;
        this.overlapFactor = 0.3;
        
        this.dealButton = document.getElementById('deal-button');
        this.hitButton = document.getElementById('hit-button');
        this.standButton = document.getElementById('stand-button');
        this.dealerCardsContainer = document.getElementById('dealer-cards');
        this.playerCardsContainer = document.getElementById('player-cards');
        this.dealerSum = document.getElementById('dealer-sum');
        this.playerSum = document.getElementById('player-sum');
        this.popup = document.getElementById('message');
        this.popupText = document.getElementById('popup-text');
        this.closeButton = document.getElementById('close-popup');
        this.dealButton = document.getElementById('deal-button');

        this.dealButton.addEventListener('click', () => this.startNewGame());
        this.hitButton.addEventListener('click', () => this.handleHit());
        this.standButton.addEventListener('click', () => this.handleStand());
        this.closeButton.addEventListener('click', () => {
            this.popup.classList.remove('show');
            this.dealButton.disabled = false;
        });

        window.addEventListener('resize', () => this.resizeHands());
    }

    initializeDeck() {
        const suits = ['heart', 'spade', 'diamond', 'club'];
        const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
        
        this.deck = [];
        for (const suit of suits) {
            for (const value of values) {
                this.deck.push({ suit, value });
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCardValue(card) {
        if (['jack', 'queen', 'king'].includes(card.value)) {
            return 10;
        } else if (card.value === '1') { // Ace
            return 11;
        } else {
            return parseInt(card.value);
        }
    }

    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === '1') {
                aces += 1;
            }
            value += this.getCardValue(card);
        }

        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces -= 1;
        }

        return value;
    }

    drawCard(isDealer, hidden = false) {
        const card = this.deck.pop();
        const hand = isDealer ? this.dealerHand : this.playerHand;
        hand.push(card);
    
        const container = isDealer ? this.dealerCardsContainer : this.playerCardsContainer;
        const cardIndex = hand.length - 1;
        const x = cardIndex * (this.cardWidth * this.overlapFactor);
    
        const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", 
            hidden ? "./SVG-cards/svg-cards.svg#back" : `./SVG-cards/svg-cards.svg#${card.suit}_${card.value}`);
        useElement.setAttribute("x", x);
        
        if (hidden) {
            useElement.setAttribute("id", "hidden-card");
        }
    
        container.appendChild(useElement);
        
        const handWidth = (hand.length * this.cardWidth * this.overlapFactor) + (this.cardWidth * (1 - this.overlapFactor));
        container.setAttribute("width", handWidth);
        
        this.maxHandWidth = Math.max(this.maxHandWidth, handWidth);
        this.resizeHands();

        return this.calculateHandValue(hand);
    }

    resizeHands() {
        [this.dealerCardsContainer, this.playerCardsContainer].forEach(container => {
            container.setAttribute("width", this.maxHandWidth);
            
            const gameArea = document.querySelector('.game-area');
            const containerWidth = gameArea.offsetWidth - (4 * 16);
            const margin = Math.max(0, (containerWidth - this.maxHandWidth) / 2);
            
            container.style.marginLeft = `${margin}px`;
            container.style.marginRight = `${margin}px`;
            
            const cards = container.children;
            const handLength = container.id === 'dealer-cards' ? this.dealerHand.length : this.playerHand.length;
            const totalWidth = (handLength * this.cardWidth * this.overlapFactor) + (this.cardWidth * (1 - this.overlapFactor));
            const offsetX = (this.maxHandWidth - totalWidth) / 2;
            
            Array.from(cards).forEach((card, index) => {
                const x = offsetX + (index * this.cardWidth * this.overlapFactor);
                card.setAttribute("x", x);
            });
        });
    }

    startNewGame() {
        this.dealerHand = [];
        this.playerHand = [];
        this.gameInProgress = true;
        this.maxHandWidth = 0;
        
        this.dealerCardsContainer.innerHTML = '';
        this.playerCardsContainer.innerHTML = '';
        this.dealerCardsContainer.setAttribute("width", 0);
        this.playerCardsContainer.setAttribute("width", 0);
        
        this.initializeDeck();
        this.shuffleDeck();
        
        this.drawCard(true, true);
        this.drawCard(true);
        this.drawCard(false);
        this.drawCard(false);
        
        this.updateSums();
        this.hitButton.disabled = false;
        this.standButton.disabled = false;
        this.dealButton.disabled = true;
        
        if (this.calculateHandValue(this.playerHand) === 21) {
            this.handleStand();
        }

        this.resizeHands();
    }

    handleHit() {
        const playerValue = this.drawCard(false);
        this.updateSums();
        
        if (playerValue > 21) {
            this.endGame('Player busts! Dealer wins!', 'lose');
        }
    }

    handleStand() {
        const hiddenCard = document.getElementById('hidden-card');
        hiddenCard.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", 
            `./SVG-cards/svg-cards.svg#${this.dealerHand[0].suit}_${this.dealerHand[0].value}`);

        while (this.calculateHandValue(this.dealerHand) < 17) {
            this.drawCard(true);
        }

        this.updateSums();
        this.determineWinner();
    }

    updateSums() {
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        this.playerSum.textContent = playerValue;
        this.dealerSum.textContent = this.gameInProgress ? 
            this.getCardValue(this.dealerHand[1]) : dealerValue;
    }

    determineWinner() {
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = this.calculateHandValue(this.dealerHand);

        if (dealerValue > 21) {
            this.endGame('Dealer busts! Player wins!', 'win');
        } else if (playerValue > dealerValue) {
            this.endGame('Player wins!', 'win');
        } else if (dealerValue > playerValue) {
            this.endGame('Dealer wins!', 'lose');
        } else {
            this.endGame('Push - It\'s a tie!', 'tie');
        }
    }

    showMessage(message) {
        this.popupText.textContent = message;
        this.popup.classList.add('show');
    }

    endGame(message, result) {
        this.gameInProgress = false;
        this.showMessage(message);
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
        this.updateSums();
    }
}

window.onload = () => {
    new BlackjackGame();
};