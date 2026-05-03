const SECRET = "electassist-2026";

function encryptKey(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
    }
    return Buffer.from(result).toString('base64');
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node encrypt_key.js <YOUR_API_KEY>");
} else {
    const key = args[0];
    console.log("Encrypted Key:");
    console.log(encryptKey(key));
    console.log("\nCopy and paste this string into js/features/chatbot.js for the ENCRYPTED_API_KEY variable.");
}
