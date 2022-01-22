
class GlobalService {

    lokiDb = require("./lokiDb.class");
    Utils = require("./utils.class");
    GraphTools = require("./graphTools.class");

    trinity = {};

    constructor() {

        // We track the selected actors for the creation of a new relation
        document.addEventListener("actorSelected", (event) => {
            const socket = event.detail.socket;
            this.trinity[socket] = event.detail.actor;
        })
    }

}
// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new GlobalService();