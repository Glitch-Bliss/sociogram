
import loki from 'lokijs';

class LokiDb {

    db;
    actors;
    qualifiers;
    relations;

    constructor() {
        this.db = new loki("sociogram.db");
        this.actors = this.db.addCollection("actors");
        this.qualifiers = this.db.addCollection("qualifiers");
        this.relations = this.db.addCollection("relations");
    }
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new LokiDb();