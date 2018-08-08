import {MarkovChain} from "./";

let test = new MarkovChain("./database.sqlite");
setTimeout(async () => {
    console.log(await test.generate(2));
},1500)
