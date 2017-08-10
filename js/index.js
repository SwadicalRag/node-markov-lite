"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite = require("sqlite3");
;
class MarkovChain {
    constructor(location) {
        this.location = location;
        this.db = new sqlite.Database(this.location);
        this.db.serialize(() => {
            this.ready();
        });
        let query = [];
        query.push("SELECT * FROM markov WHERE (");
        query.push("message LIKE $sentence1 ");
        query.push("OR [message] Like $sentence2 ");
        query.push("OR [message] Like $sentence3 ");
        query.push("OR [message] = $sentence4");
        query.push(") ORDER BY RANDOM() LIMIT 1");
        this.baseQuery = query.join("\n");
    }
    ready() {
        this.db.run("CREATE TABLE IF NOT EXISTS markov (`timestamp` DATETIME, `authorID` VARCHAR(255), `authorName` VARCHAR(255), `message` VARCHAR(255));");
    }
    learn(data) {
        return new Promise((resolve, reject) => {
            data.message = data.message.trim().replace(/\s+/g, " "); // standardise whitespace
            this.db.run("INSERT INTO markov VALUES ($timestamp, $authorID, $authorName, $message)", {
                $timestamp: data.timestamp ? data.timestamp.getTime() : Date.now(),
                $authorID: data.authorName,
                $authorName: data.authorID,
                $message: data.message,
            }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    getWords(sentence) {
        if (sentence.match(/^\s*$/)) {
            return [];
        }
        return sentence.split(/\s+/g);
    }
    getCurrentChain(words, depth = 2) {
        let out = [];
        for (let i = words.length - 1; i >= 0; i--) {
            if (depth > 0) {
                depth = depth - 1;
                out.push(words[i]);
            }
            else {
                break;
            }
        }
        return out;
    }
    matchCurrentChain(words, chain, depth = 2) {
        let out = [];
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            if ((word == chain[0]) || !chain[0]) {
                let acceptable = true;
                for (let i2 = 0; i2 < chain.length; i2++) {
                    if (chain[i2] != words[i + i2]) {
                        acceptable = false;
                        break;
                    }
                }
                if (acceptable) {
                    if (chain.length < depth) {
                        for (let i2 = 0; i2 < depth; i2++) {
                            out.push(words[i2 + i]);
                        }
                    }
                    else {
                        for (let i2 = 1; i2 < chain.length; i2++) {
                            out.push(chain[i2]);
                        }
                        if (words[i + chain.length]) {
                            out.push(words[i + chain.length]);
                        }
                    }
                    break;
                }
            }
        }
        return out;
    }
    queryDB(chain) {
        return new Promise((resolve, reject) => {
            let sentence = chain.join(" ");
            if (sentence.trim() == "") {
                this.db.get("SELECT * FROM markov ORDER BY RANDOM() LIMIT 1", (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            }
            else {
                this.db.get(this.baseQuery, {
                    $sentence1: `% ${sentence} %`,
                    $sentence2: `% ${sentence}`,
                    $sentence3: `${sentence} %`,
                    $sentence4: `${sentence}`,
                }, (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            }
        });
    }
    generate(depth = 2, sentence = "") {
        return __awaiter(this, void 0, void 0, function* () {
            let words = this.getWords(sentence);
            let chain = this.getCurrentChain(words, depth);
            let out = [];
            for (let word of words) {
                out.push(word);
            }
            let lastChain;
            while (true) {
                let data = yield this.queryDB(chain);
                if (!data) {
                    break;
                }
                words = this.getWords(data.message);
                lastChain = chain;
                chain = this.matchCurrentChain(words, chain, depth);
                if (chain.length < depth) {
                    break;
                }
                else if (lastChain.length < depth) {
                    for (let word of chain) {
                        out.push(word);
                    }
                }
                else {
                    out.push(chain[chain.length - 1]);
                }
            }
            return out.join(" ");
        });
    }
}
exports.MarkovChain = MarkovChain;
//# sourceMappingURL=index.js.map