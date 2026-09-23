import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { consola } from "consola";
import { parse as parseJsonc, modify, applyEdits, printParseErrorCode } from "jsonc-parser";

const formattingOptions = { tabSize: 2, insertSpaces: true };

export class JsonConfig {
  #filePath;
  data;
  #rawText;
  #parseError;

  constructor(filePath, defaultData = {}) {
    this.#filePath = filePath;
    this.data = {};
    this.#rawText = "{}";
    this.#parseError = null;
    this.#load(defaultData);
  }

  get file() {
    return this.#filePath;
  }

  get parseError() {
    return this.#parseError;
  }

  get(key, defaultValue) {
    return Object.hasOwn(this.data, key) ? this.data[key] : defaultValue;
  }

  set(key, value) {
    this.data[key] = value;
    this.#rawText = applyEdits(this.#rawText, modify(this.#rawText, [key], value, { formattingOptions }));
    this.#save();
  }

  #load(defaultData) {
    if (!existsSync(this.#filePath)) {
      this.data = { ...defaultData };
      return;
    }

    this.#rawText = readFileSync(this.#filePath, "utf-8");

    const errors = [];
    const parsed = parseJsonc(this.#rawText, errors, { allowTrailingComma: true });

    if (errors.length > 0) {
      const [{ error, offset }] = errors;
      this.#parseError = new Error(`${printParseErrorCode(error)} at offset ${offset}`);
      consola.warn(`Config parse error in ${this.#filePath}:`, this.#parseError.message);
      this.data = { ...defaultData };
    } else {
      this.data = parsed ?? { ...defaultData };
    }
  }

  #save() {
    try {
      writeFileSync(this.#filePath, this.#rawText, "utf-8");
    } catch (err) {
      consola.error(`Failed to save config to ${this.#filePath}:`, err.message);
    }
  }
}
