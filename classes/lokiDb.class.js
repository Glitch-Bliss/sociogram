
const loki = require("lokijs");
const GlobalService = require("./global.service.class");

//https://rawgit.com/techfort/LokiJS/master/examples/sandbox/LokiSandbox.htm
class LokiDb {

    db;
    nodes;
    relations;

    selectedActor1;
    selectedQualifier;
    selectedActor2;

    constructor() {
        this.db = new loki("sociogram.db");
        this.nodes = this.db.addCollection("nodes");
        this.relations = this.db.addCollection("relations");
    }

    /**
     * Build graph code from datas of db
     * @returns 
     */
    getGraphDefinition() {
        let graphDefinition = 'graph TB\n';
        const relationsFound = this.db.relations.find();
        for (let i = 0; i < relationsFound.length; i++) {
            graphDefinition += relationsFound[i].code;
        }

        //then we add the clicks callbacks
        for (let i = 0; i < relationsFound.length; i++) {
            graphDefinition += 'click ' + relationsFound[i].emettorId + ' nodeClicked "Tooltip"\n';
            graphDefinition += 'click ' + relationsFound[i].receptorId + ' nodeClicked "Tooltip"\n';
        }

        return graphDefinition;
    }

    /**
     * Create a new relation from a threepart relation of givent elements
     */
    addRelation(emettorId, receptorId, qualifierId) {

        // We forbid duplicates
        const doc = this.relations.find({
            from: emettorId,
            by: receptorId,
            to: qualifierId
        });

        if (doc.length <= 0) {
            this.relations.insert({
                from: emettorId,
                by: receptorId,
                to: qualifierId
            });
        } else {
            throw "Cette relation existe déjà";
        }
    }

    getRelations() {
        return this.relations.find();
    }

    /**
     * Add node, inferring attributes from payload
     * @param {*} name 
     * @param {*} type 
     */
    addNode(payload, type) {
        let node = {};
        node.id = type + Math.random().toString(36).substring(3);
        node.type = type;

        for (let attribute in payload) {
            node[attribute] = payload[attribute];
        }

        if (this.nodes.find({ name: node.name }).length == 0) {
            const insertedNode = this.nodes.insert(node);
        }
    }

    /**
     * Add a single actor in db
     */
    addActor(payload) {
        if (payload.name) {
            this.addNode(payload, "actor");
        }
    }

    getActors() {
        return this.nodes.find({ type: "actor" });
    }

    /**
     * Add a single qualifier in db
     */
    addQualifier(payload) {
        if (payload.name) {
            this.addNode(payload, "qualifier");
        }
    }

    getQualifiers() {
        return this.nodes.find({ type: "qualifier" });
    }
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new LokiDb();