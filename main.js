const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let currentIndex = 0;
let autoPlayInterval = null;
let isEncoding = true;

// DOM Elements
const keywordInput = document.getElementById('keyword-input');
const messageInput = document.getElementById('message-input');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnAuto = document.getElementById('btn-auto');
const btnReset = document.getElementById('btn-reset');
const modeEncodeBtn = document.getElementById('mode-encode');
const modeDecodeBtn = document.getElementById('mode-decode');
const resultDisplay = document.getElementById('result-display');
const tutorialStatus = document.getElementById('tutorial-status');
const keyExpansion = document.getElementById('key-expansion');
const tabulaRecta = document.getElementById('tabula-recta');

// Initialization
function init() {
    renderTabulaRecta();
    resetState();
    setupEventListeners();
}

function renderTabulaRecta() {
    // Corner cell
    const corner = document.createElement('div');
    corner.classList.add('grid-cell', 'grid-corner');
    corner.textContent = "+";
    tabulaRecta.appendChild(corner);

    // Header Row (Plaintext)
    for (let i = 0; i < 26; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell', 'grid-header-row');
        cell.textContent = ALPHABET[i];
        cell.id = `header-col-${i}`;
        tabulaRecta.appendChild(cell);
    }

    // Grid Body
    for (let r = 0; r < 26; r++) {
        // Header Column (Key)
        const rowHeader = document.createElement('div');
        rowHeader.classList.add('grid-cell', 'grid-header-col');
        rowHeader.textContent = ALPHABET[r];
        rowHeader.id = `header-row-${r}`;
        tabulaRecta.appendChild(rowHeader);

        // Cells
        for (let c = 0; c < 26; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            const charIndex = (r + c) % 26;
            cell.textContent = ALPHABET[charIndex];
            cell.id = `cell-${r}-${c}`;
            tabulaRecta.appendChild(cell);
        }
    }
}

function resetState() {
    currentIndex = -1; // Start before first character
    stopAutoPlay();
    resultDisplay.textContent = "";
    cleanHighlights();
    updateKeyExpansion();
    updateControls();

    // Update labels based on mode
    const action = isEncoding ? "encrypt" : "decrypt";
    tutorialStatus.textContent = `Ready. Click 'Next Letter' to ${action} the first character.`;
}

function cleanHighlights() {
    document.querySelectorAll('.highlight-row').forEach(el => el.classList.remove('highlight-row'));
    document.querySelectorAll('.highlight-col').forEach(el => el.classList.remove('highlight-col'));
    document.querySelectorAll('.highlight-intersect').forEach(el => el.classList.remove('highlight-intersect'));
    document.querySelectorAll('.active-stack').forEach(el => el.classList.remove('active-stack'));
}

function updateKeyExpansion() {
    const message = messageInput.value.toUpperCase().replace(/[^A-Z]/g, '');
    const keyword = keywordInput.value.toUpperCase().replace(/[^A-Z]/g, '');

    keyExpansion.innerHTML = "";

    if (keyword.length === 0) return;

    for (let i = 0; i < message.length; i++) {
        const keyChar = keyword[i % keyword.length];
        const msgChar = message[i]; // This is Plaintext in encode mode, Ciphertext in decode mode

        const stack = document.createElement('div');
        stack.classList.add('char-stack');
        stack.id = `stack-${i}`;

        if (isEncoding) {
            stack.innerHTML = `
                <span class="char-key">${keyChar}</span>
                <span class="char-plain">${msgChar}</span>
                <span class="char-cipher" id="output-char-${i}">-</span>
            `;
        } else {
            stack.innerHTML = `
                <span class="char-key">${keyChar}</span>
                <span class="char-cipher">${msgChar}</span>
                <span class="char-plain" id="output-char-${i}">-</span>
            `;
        }
        keyExpansion.appendChild(stack);
    }
}

function stepForward() {
    const message = messageInput.value.toUpperCase().replace(/[^A-Z]/g, '');
    const keyword = keywordInput.value.toUpperCase().replace(/[^A-Z]/g, '');

    if (message.length === 0 || keyword.length === 0) {
        tutorialStatus.textContent = "Please enter both a keyword and a message.";
        return;
    }

    if (currentIndex < message.length - 1) {
        currentIndex++;
        processCurrentIndex(message, keyword);
    } else {
        stopAutoPlay();
        tutorialStatus.textContent = isEncoding ? "Encryption complete!" : "Decryption complete!";
    }
    updateControls();
}

function stepBackward() {
    if (currentIndex >= 0) {
        currentIndex--;
        const message = messageInput.value.toUpperCase().replace(/[^A-Z]/g, '');
        const keyword = keywordInput.value.toUpperCase().replace(/[^A-Z]/g, '');

        // Clear result for the stepped-back index
        const outputSlot = document.getElementById(`output-char-${currentIndex + 1}`);
        if (outputSlot) outputSlot.textContent = "-";

        // Re-calculate result string up to current index
        let result = "";
        for (let i = 0; i <= currentIndex; i++) {
            const mChar = message[i];
            const kChar = keyword[i % keyword.length];
            const mIdx = ALPHABET.indexOf(mChar);
            const kIdx = ALPHABET.indexOf(kChar);

            if (isEncoding) {
                result += ALPHABET[(mIdx + kIdx) % 26];
            } else {
                result += ALPHABET[(mIdx - kIdx + 26) % 26];
            }
        }
        resultDisplay.textContent = result;

        if (currentIndex === -1) {
            cleanHighlights();
            const action = isEncoding ? "encrypt" : "decrypt";
            tutorialStatus.textContent = `Ready. Click 'Next Letter' to ${action} the first character.`;
        } else {
            processCurrentIndex(message, keyword);
        }
    }
    updateControls();
}

function processCurrentIndex(message, keyword) {
    cleanHighlights();

    const msgChar = message[currentIndex];
    const keyChar = keyword[currentIndex % keyword.length];

    const mIdx = ALPHABET.indexOf(msgChar);
    const kIdx = ALPHABET.indexOf(keyChar);

    let resultChar, resultIdx;

    if (isEncoding) {
        // ENCODE: Plain (Col) + Key (Row) -> Cipher (Intersect)
        resultIdx = (mIdx + kIdx) % 26;
        resultChar = ALPHABET[resultIdx];

        // Visuals
        document.getElementById(`header-row-${kIdx}`).classList.add('highlight-row'); // Key Row
        for (let c = 0; c < 26; c++) document.getElementById(`cell-${kIdx}-${c}`).classList.add('highlight-row');

        document.getElementById(`header-col-${mIdx}`).classList.add('highlight-col'); // Plain Col
        for (let r = 0; r < 26; r++) document.getElementById(`cell-${r}-${mIdx}`).classList.add('highlight-col');

        const intersectCell = document.getElementById(`cell-${kIdx}-${mIdx}`);
        intersectCell.classList.add('highlight-intersect');
        intersectCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        tutorialStatus.innerHTML = `Encrypting '<b>${msgChar}</b>' with Key '<b>${keyChar}</b>'.<br>Intersection of Key-Row <b>${keyChar}</b> and Plain-Col <b>${msgChar}</b> is <b>${resultChar}</b>.`;

    } else {
        // DECODE: Key (Row) -> Find Cipher in Row -> Plain (Col Header)
        resultIdx = (mIdx - kIdx + 26) % 26;
        resultChar = ALPHABET[resultIdx];

        // Visuals
        document.getElementById(`header-row-${kIdx}`).classList.add('highlight-row'); // Key Row
        for (let c = 0; c < 26; c++) document.getElementById(`cell-${kIdx}-${c}`).classList.add('highlight-row');

        // Highlight the specific Cipher cell in that row
        // In row kIdx, the value msgChar is found at column resultIdx?
        // Let's check: cell value at (row=kIdx, col=?) is msgChar?
        // value = (row + col) % 26.
        // We know value = mIdx (cipher char index).
        // mIdx = (kIdx + col) % 26  => col = (mIdx - kIdx) % 26.
        // So yes, cell at [kIdx, resultIdx] should contain msgChar.

        const cipherCell = document.getElementById(`cell-${kIdx}-${resultIdx}`);
        cipherCell.classList.add('highlight-intersect');
        cipherCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        // Highlight the Plaintext Column to show the result
        document.getElementById(`header-col-${resultIdx}`).classList.add('highlight-col');
        for (let r = 0; r < 26; r++) document.getElementById(`cell-${r}-${resultIdx}`).classList.add('highlight-col');

        tutorialStatus.innerHTML = `Decrypting '<b>${msgChar}</b>' with Key '<b>${keyChar}</b>'.<br>Find <b>${msgChar}</b> in Key-Row <b>${keyChar}</b>. <br>Look UP to the header to find Plaintext <b>${resultChar}</b>.`;
    }

    // Update Stack
    const stack = document.getElementById(`stack-${currentIndex}`);
    if (stack) stack.classList.add('active-stack');

    const outputSlot = document.getElementById(`output-char-${currentIndex}`);
    if (outputSlot) outputSlot.textContent = resultChar;

    // Update Result Text
    let currentResult = resultDisplay.textContent;
    if (currentResult.length <= currentIndex) {
        resultDisplay.textContent += resultChar;
    }
}

function updateControls() {
    const message = messageInput.value.toUpperCase().replace(/[^A-Z]/g, '');
    btnPrev.disabled = currentIndex < 0;
    btnNext.disabled = currentIndex >= message.length - 1;
}

function toggleAutoPlay() {
    if (autoPlayInterval) {
        stopAutoPlay();
    } else {
        btnAuto.textContent = "Pause";
        stepForward();
        autoPlayInterval = setInterval(() => {
            const message = messageInput.value.toUpperCase().replace(/[^A-Z]/g, '');
            if (currentIndex >= message.length - 1) {
                stopAutoPlay();
            } else {
                stepForward();
            }
        }, 1200);
    }
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    btnAuto.textContent = "Auto Play";
}

function setMode(encoding) {
    if (isEncoding === encoding) return;
    isEncoding = encoding;

    if (isEncoding) {
        modeEncodeBtn.classList.add('active');
        modeDecodeBtn.classList.remove('active');
        messageInput.placeholder = "message to encrypt...";
    } else {
        modeDecodeBtn.classList.add('active');
        modeEncodeBtn.classList.remove('active');
        messageInput.placeholder = "ciphertext to decrypt...";
    }
    resetState();
}

function setupEventListeners() {
    btnNext.addEventListener('click', () => { stopAutoPlay(); stepForward(); });
    btnPrev.addEventListener('click', () => { stopAutoPlay(); stepBackward(); });
    btnAuto.addEventListener('click', toggleAutoPlay);
    btnReset.addEventListener('click', resetState);

    modeEncodeBtn.addEventListener('click', () => setMode(true));
    modeDecodeBtn.addEventListener('click', () => setMode(false));

    keywordInput.addEventListener('input', () => { resetState(); });
    messageInput.addEventListener('input', () => { resetState(); });
}

init();
