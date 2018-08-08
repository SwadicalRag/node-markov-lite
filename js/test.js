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
const _1 = require("./");
let mark = new _1.MarkovChainPostgres({
    database: "markov",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "postgres",
});
setTimeout(() => __awaiter(this, void 0, void 0, function* () {
    yield mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "i love green fruits"
    });
    yield mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "i love red fruits"
    });
    yield mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "i love red bananas"
    });
    yield mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "green fruits are great"
    });
    yield mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "fruits are horrible"
    });
    console.log("Learnt!");
    for (let i = 0; i < 5; i++) {
        console.log(yield mark.generate(2, 50, "i"));
    }
}), 1000);
//# sourceMappingURL=test.js.map