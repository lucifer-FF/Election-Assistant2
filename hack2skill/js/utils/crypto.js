// A simple XOR cipher combined with Base64 encoding.
// Note: This provides obfuscation to prevent automated scraping of the API key from public repositories.
// It is NOT cryptographically secure against a determined attacker who can read the source code.

const SECRET = "electassist-2026"; // A simple secret key for XOR

export function encryptKey(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
    }
    return btoa(result);
}

export function decryptKey(encodedText) {
    try {
        const text = atob(encodedText);
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
        }
        return result;
    } catch (e) {
        console.error("Failed to decrypt key");
        return null;
    }
}
