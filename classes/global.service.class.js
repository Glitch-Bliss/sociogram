
class GlobalService {

    lokiDb = require("./lokiDb.class");
    Utils = require("./utils.class");
    GraphTools = require("./graphTools.class");

    cellclickEvent = new CustomEvent("cellClick");
    constructor() {
    }

}
// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new GlobalService();