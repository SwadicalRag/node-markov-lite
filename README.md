# node-markov-lite
modified lightweight markov for node.js

```typescript

let mark = new MarkovChain(":memory:");

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
        console.log(await mark.generate())
    }
},1000);

```
Learnt!
i love green fruits are horrible
fruits are horrible
green fruits are great
i love green fruits are great
i love green fruits are great
```
