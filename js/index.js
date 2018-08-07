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
        // query.push("OR [message] Like $sentence2 ");
        query.push("OR [message] Like $sentence3 ");
        // query.push("OR [message] = $sentence4");
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
        for (let i = 0; i < depth; i++) {
            if (words[words.length - depth + i]) {
                out.push(words[words.length - depth + i]);
            }
        }
        return out;
    }
    matchCurrentChain(words, chain, depth = 2) {
        let out = [];
        let chains = [];
        for (let i = 0; i < words.length; i++) {
            let word = words[i].toLocaleLowerCase();
            if (!chain[0] || (word == chain[0].toLocaleLowerCase())) {
                let acceptable = true;
                for (let i2 = 0; i2 < chain.length; i2++) {
                    if (chain[i2].toLocaleLowerCase() != words[i + i2].toLocaleLowerCase()) {
                        acceptable = false;
                        break;
                    }
                }
                if (acceptable) {
                    if (chain.length < depth) {
                        for (let i2 = i; i2 < Math.min(i + depth, words.length); i2++) {
                            out.push(words[i2]);
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
                    chains.push(out);
                    out = [];
                    acceptable = false;
                }
            }
        }
        return chains[Math.round(Math.random() * (chains.length - 1))] || out;
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
                this.db.all(this.baseQuery, {
                    $sentence1: `_% ${sentence} %_`,
                    // $sentence2: `% ${sentence}`,
                    $sentence3: `${sentence} %_`,
                }, (err, resArr) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        for (let res of resArr) {
                            if (!res.message.endsWith(sentence)) {
                                resolve(res);
                                return;
                            }
                        }
                        resolve(null);
                    }
                });
            }
        });
    }
    generate(depth = 2, maxLength = 50, sentence = "", callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let words = this.getWords(sentence);
            let chain = this.getCurrentChain(words, depth);
            let out = [];
            for (let word of words) {
                out.push(word);
                if (callback) {
                    callback(word);
                }
            }
            let lastChain;
            while (out.length < maxLength) {
                let data = yield this.queryDB(chain);
                if (!data || !data.message) {
                    break;
                }
                words = this.getWords(data.message);
                lastChain = chain;
                chain = this.matchCurrentChain(words, chain, depth);
                if (((chain.length - lastChain.length) <= 0) && (chain.length < depth)) {
                    break;
                }
                else if (lastChain.length < depth) {
                    for (let i = lastChain.length; i < chain.length; i++) {
                        out.push(chain[i]);
                        if (callback) {
                            callback(chain[i]);
                        }
                    }
                }
                else {
                    out.push(chain[chain.length - 1]);
                    if (callback) {
                        callback(chain[chain.length - 1]);
                    }
                }
            }
            return out.join(" ");
        });
    }
}
exports.MarkovChain = MarkovChain;
//# sourceMappingURL=index.js.map