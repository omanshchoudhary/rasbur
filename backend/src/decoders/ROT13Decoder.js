import Decoder from "./Decoder.js";

export default class ROT13Decoder extends Decoder {
  name = "ROT13";

  confidence(input) {
    if (!input) return 0;

    const hasLetters = /[a-zA-Z]/.test(input);
    return hasLetters ? 0.5 : 0;
  }

  decode(input) {
    const result = input.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= "Z" ? 65 : 97;
      return String.fromCharCode(
        ((char.charCodeAt(0) - base + 13) % 26) + base,
      );
    });
    return result === input ? null : result;
  }

  explain() {
    return "ROT13 is a letter substitution cipher that shifts each letter 13 positions in the alphabet.";
  }
}
