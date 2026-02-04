import Decoder from "./Decoder";

export default class MorseDecoder extends Decoder {
  name = "Morse Code";

  constructor() {
    super();
    this.morseToChar = {
      ".-": "A",
      "-...": "B",
      "-.-.": "C",
      "-..": "D",
      ".": "E",
      "..-.": "F",
      "--.": "G",
      "....": "H",
      "..": "I",
      ".---": "J",
      "-.-": "K",
      ".-..": "L",
      "--": "M",
      "-.": "N",
      "---": "O",
      ".--.": "P",
      "--.-": "Q",
      ".-.": "R",
      "...": "S",
      "-": "T",
      "..-": "U",
      "...-": "V",
      ".--": "W",
      "-..-": "X",
      "-.--": "Y",
      "--..": "Z",
      "-----": "0",
      ".----": "1",
      "..---": "2",
      "...--": "3",
      "....-": "4",
      ".....": "5",
      "-....": "6",
      "--...": "7",
      "---..": "8",
      "----.": "9",
      ".-.-.-": ".",
      "--..--": ",",
      "..--..": "?",
      "-.-.-": ";",
      "---...": ":",
      "-....-": "-",
      "..--.-": "_",
      ".-..-.": '"',
      ".--.-.": "'",
    };
  }

  confidence(input) {
    if (!input) return 0;
    const morseRegex = /^([.-]{1,5})(\s+[.-]{1,5})+$/;
    return morseRegex.test(input.trim()) ? 0.75 : 0;
  }

  decode(input) {
    try {
      const words = input.trim().split(" ");
      const result = words
        .map((word) => {
          const letters = word.trim().split(/\s+/);
          return letters.map((code) => this.morseToChar[code] || "").join("");
        })
        .join(" ");
      return result.includes("") ? null : result;
    } catch {
      return null;
    }
  }
  explain() {
    return "Morse code represents text using dots (.) and dashes (-) for letters and numbers.";
  }
}
