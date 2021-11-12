
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
    addRelation() {
        const emettorElement = document.querySelector("#emettor");
        const receptorElement = document.querySelector("#receptor");
        const qualifierElement = document.querySelector("#qualifier");

        if (emettorElement.dataset.id && receptorElement.dataset.id && qualifierElement.dataset.id) {
            let code = emettorElement.dataset.id + '(' + emettorElement.dataset.name + ') -->|' + qualifierElement.dataset.name + '| ' + receptorElement.dataset.id + '(' + receptorElement.dataset.name + ')\n';
            const name = emettorElement.dataset.name + ' ' + qualifierElement.dataset.name + ' ' + receptorElement.dataset.name;
            const id = Math.random().toString(36).substring(3);
            this.db.relations.insert({ code: code, name: name, id: id, emettorId: emettorElement.dataset.id, receptorId: receptorElement.dataset.id });
        }
    }

    /**
     * Add a single actor in db
     */
    addsActor() {
        const name = document.querySelector("#actorname").value;
        if (name) {
            const id = "actor" + Math.random().toString(36).substring(3);
            if (this.db.actors.find({ name: name }).length == 0) {
                this.db.actors.insert({ name: name, id: id });
            }
        }
        document.dispatchEvent(updateEvent);
    }
    
    /**
     * Add a single qualifier in db
     */
    addsQualifier() {
        const name = document.querySelector("#qualifiername").value;
        if (name) {
            const id = Math.random().toString(36).substring(3);
            if (this.db.qualifiers.find({ name: name }).length == 0) {
                this.db.qualifiers.insert({ name: name, id: id });
            }
        }
        document.dispatchEvent(updateEvent);
    }    
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new LokiDb();