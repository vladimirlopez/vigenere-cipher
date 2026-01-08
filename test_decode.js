const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function vigenereDecode(message, keyword) {
    let result = "";
    message = message.toUpperCase().replace(/[^A-Z]/g, '');
    keyword = keyword.toUpperCase().replace(/[^A-Z]/g, '');

    for (let i = 0; i < message.length; i++) {
        const mIdx = ALPHABET.indexOf(message[i]);
        const kIdx = ALPHABET.indexOf(keyword[i % keyword.length]);
        // Decode logic: (Cipher - Key + 26) % 26
        result += ALPHABET[(mIdx - kIdx + 26) % 26];
    }
    return result;
}

const output = vigenereDecode("RIJVS", "KEY");
console.log(`Input: RIJVS, Key: KEY`);
console.log(`Expected: HELLO`);
console.log(`Actual: ${output}`);

if (output === "HELLO") {
    console.log("DECODE TEST PASSED");
} else {
    console.log("DECODE TEST FAILED");
    process.exit(1);
}
