import {MarkovChainPostgres} from "./";

let mark = new MarkovChainPostgres({
    database: "markov",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "postgres",
});

setTimeout(async () => {
    await mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "i love green fruits"
    });

    await mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "i love red fruits"
    });

    await mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "i love red bananas"
    });

    await mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "green fruits are great"
    });

    await mark.learn({
        authorID: "ID",
        authorName: "swad",
        message: "fruits are horrible"
    });

    console.log("Learnt!");

    for(let i=0;i < 5;i++) {
        console.log(await mark.generate(2,50,"i"))
    }
},1000);
