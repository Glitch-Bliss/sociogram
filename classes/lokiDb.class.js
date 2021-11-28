
const loki = require("lokijs");

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
        }else {
            throw "Cette relation existe déjà";
        }
    }

    getRelations() {
        return this.relations.find();
    }

    addNode(name, type) {
        const id = type + Math.random().toString(36).substring(3);
        if (this.nodes.find({ name: name }).length == 0) {
            this.nodes.insert({ name: name, id: id, type: type });
        }
    }

    /**
     * Add a single actor in db
     */
    addActor(name) {
        if (name) {
            this.addNode(name, "actor");
        }
    }

    getActors() {
        return this.nodes.find({ type: "actor" });
    }

    /**
     * Add a single qualifier in db
     */
    addQualifier(name) {
        if (name) {
            this.addNode(name, "qualifier");
        }
    }

    getQualifiers() {
        return this.nodes.find({ type: "qualifier" });
    }
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new LokiDb();