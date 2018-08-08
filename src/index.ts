import * as sqlite from "sqlite3";

export interface ILearnData {
    timestamp?: Date;
    message: string;
    authorID: string;
    authorName: string;
};

export class MarkovChain {
    db: sqlite.Database;
    baseQuery: string;

    constructor(public location:string) {
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

    learn(data: ILearnData) {
        return new Promise((resolve,reject) => {
            data.message = data.message.trim().replace(/\s+/g," "); // standardise whitespace

            this.db.run("INSERT INTO markov VALUES ($timestamp, $authorID, $authorName, $message)", {
                $timestamp: data.timestamp ? data.timestamp.getTime() : Date.now(),
                $authorID: data.authorName,
                $authorName: data.authorID,
                $message: data.message,
            },(err) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    private getWords(sentence: string) {
        if(sentence.match(/^\s*$/)) {
            return [];
        }

        return sentence.split(/\s+/g);
    }

    private getCurrentChain(words: string[],depth: number = 2) {
        let out: string[] = [];

        for(let i=0;i < depth;i++) {
            if(words[words.length - depth + i]) {
                out.push(words[words.length - depth + i]);
            }
        }

        return out;
    }

    private matchCurrentChain(words: string[],chain: string[],depth: number = 2) {
        let out: string[] = [];
        let chains: string[][] = [];

        for(let i=0;i < words.length;i++) {
            let word = words[i].toLocaleLowerCase();

            if(!chain[0] || (word == chain[0].toLocaleLowerCase())) {
                let acceptable = true;

                for(let i2=0;i2 < chain.length;i2++) {
                    if (!words[i + i2] || (chain[i2].toLocaleLowerCase() != words[i + i2].toLocaleLowerCase())) {
                        acceptable = false;
                        break;
                    }
                }

                if(acceptable) {
                    if(chain.length < depth) {
                        for(let i2=i;i2 < Math.min(i + depth,words.length);i2++) {
                            out.push(words[i2]);
                        }
                    }
                    else {
                        for(let i2=1;i2 < chain.length;i2++) {
                            out.push(chain[i2]);
                        }

                        if(words[i + chain.length]) {
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

    queryDB(chain: string[]):Promise<ILearnData> {
        return new Promise((resolve,reject) => {
            let sentence = chain.join(" ");

            if(sentence.trim() == "") {
                this.db.get("SELECT * FROM markov ORDER BY RANDOM() LIMIT 1",(err,res) => {
                    if(err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            }
            else {
                this.db.all(this.baseQuery,{
                    $sentence1: `_% ${sentence} %_`,
                    // $sentence2: `% ${sentence}`,
                    $sentence3: `${sentence} %_`,
                    // $sentence4: `${sentence}`,
                },(err,resArr:ILearnData[]) => {
                    if(err) {
                        reject(err);
                    }
                    else {
                        for(let res of resArr) {
                            if(!res.message.endsWith(sentence)) {
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

    async generate(depth: number = 2,maxLength: number = 50,sentence:string = "",callback?: (word: string) => void) {
        let words = this.getWords(sentence);
        let chain = this.getCurrentChain(words,depth);
        
        let out:string[] = [];

        for(let word of words) {
            out.push(word);
            if(callback) {
                callback(word);
            }
        }

        let lastChain;

        while(out.length < maxLength) {
            let data = await this.queryDB(chain);

            if(!data || !data.message) {
                break;
            }

            words = this.getWords(data.message);

            lastChain = chain;
            chain = this.matchCurrentChain(words,chain,depth);

            if(((chain.length - lastChain.length) <= 0) && (chain.length < depth)) {
                break;
            }
            else if(lastChain.length < depth) {
                for(let i=lastChain.length;i < chain.length;i++) {
                    out.push(chain[i]);
                    if(callback) {
                        callback(chain[i]);
                    }
                }
            }
            else {
                out.push(chain[chain.length - 1]);
                if(callback) {
                    callback(chain[chain.length - 1]);
                }
            }
        }

        return out.join(" ");
    }
}
