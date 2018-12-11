

import '../scss/main.scss';
import { mermaidAPI } from 'mermaid';

/**
 * LOKI JS
 */

const loki = require("lokijs");
const db = new loki("sociogram.db");
const actors = db.addCollection("actors");
const qualifiers = db.addCollection("qualifiers");
const relations = db.addCollection("relations");


let jsonTest = {
    "actors": [
        { "name": "actor1", "id": "fezfzfzf" },
        { "name": "actor2", "id": "sfsqfsf" }
    ],
    "relations": [
        { "name": "actor1 aime actor2", "code": "1[acteur1] -->|aime| 2[acteur2]" },
        { "name": "actor2 déteste actor1", "code": "2[acteur2] -->|aime| 1[acteur1]" },
    ],
    "qualifiers": [
        { "name": "aime", "id": "ddzzdd" },
        { "name": "déteste", "id": "gdsdg" }
    ]
};

jsonTest.actors.forEach((actor) => {
    if (actors.find({ name: actor.name }).length == 0) {
        actors.insert({ name: actor.name, id: actor.id });
    }
});

jsonTest.qualifiers.forEach((qualifier) => {
    if (qualifiers.find({ name: qualifier.name }).length == 0) {
        qualifiers.insert({ name: qualifier.name, id: qualifier.id });
    }
});


/**
 * MERMAID
 */

const mermaidConfig = {
    startOnLoad: false,
    htmlLabels: true,
    callback: function (id) { },
    flowchart: {
        useMaxWidth: true,
    },
    logLevel: 5
};

let randId = 0;
function renderGraph() {
    console.log("Render " + buildGraph());
    const element = document.querySelector("#graph");
    //To overcome a bug in api, first parameter has to be different each time, a random string do the job
    mermaidAPI.render("bidon" + (randId++), buildGraph(), (svgCode, bindFunctions) => {
        element.innerHTML = svgCode;
    });
}

function buildGraph() {
    let graphDefinition = 'graph TB\n';
    const relationsFound = relations.find();
    for (let i = 0; i < relationsFound.length; i++) {
        graphDefinition += relationsFound[i].code + '\n';
    }
    return graphDefinition;
}

/**
 * App logic
 */
const updateEvent = new Event('update');

function addRelation() {
    const emettorElement = document.querySelector("#emettor");
    const receptorElement = document.querySelector("#receptor");
    const qualifierElement = document.querySelector("#qualifier");

    if (emettorElement.dataset.id && receptorElement.dataset.id && qualifierElement.dataset.id) {
        const code = emettorElement.dataset.id + '[' + emettorElement.dataset.name + '] -->|' + qualifierElement.dataset.name + '| ' + receptorElement.dataset.id + '[' + receptorElement.dataset.name + ']';
        const name = emettorElement.dataset.name + ' ' + qualifierElement.dataset.name + ' ' + receptorElement.dataset.name;
        relations.insert({ code: code, name: name });
        renderGraph();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    mermaidAPI.initialize(mermaidConfig, "graph");
    document.dispatchEvent(updateEvent);

    //Pevent forms to try submitting
    document.querySelectorAll("form").forEach((form) => {
        form.addEventListener('submit', (event) => event.preventDefault());
    });

    // Adds an actor
    document.querySelector("#button-actor").addEventListener('click', (event) => {
        const name = document.querySelector("#actorname").value;
        if (name) {
            const id = Math.random().toString(36).substring(3);
            if (actors.find({ name: name }).length == 0) {
                actors.insert({ name: name, id: id });
            }
        }
        document.dispatchEvent(updateEvent);
    });

    // Adds qualifier
    document.querySelector("#button-qualifier").addEventListener('click', (event) => {
        const name = document.querySelector("#qualifiername").value;
        if (name) {
            const id = Math.random().toString(36).substring(3);
            if (qualifiers.find({ name: name }).length == 0) {
                qualifiers.insert({ name: name, id: id });
            }
        }
        document.dispatchEvent(updateEvent);
    });
});

function emptyRelationChunks() {
    document.querySelector("#emettor").dataset.id = "";
    document.querySelector("#emettor").dataset.name = "";
    document.querySelector("#qualifier").dataset.id = "";
    document.querySelector("#qualifier").dataset.name = "";    
    document.querySelector("#receptor").dataset.id = "";
    document.querySelector("#receptor").dataset.name = "";    
}

document.addEventListener("update", () => {
    /**
     * Actors tags update
     */
    const actorsFound = actors.find();
    let actorsTag = "";
    for (let i = 0; i < actorsFound.length; i++) {
        const id = actorsFound[i].id;
        const name = actorsFound[i].name;
        //const actorTag = '<span class="tag" data-id="' + id + '" data-name="' + name + '" data-type="actor">' + name + '<i class="far fa-times-circle actor"></i></span>';
        const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one" data-id="' + id + '" data-name="' + name + '" data-type="actor">' + name + '</a>';
        actorsTag += actorTag;
    }
    document.querySelectorAll(".actorsTag").forEach((actorTag) => {
        actorTag.innerHTML = actorsTag;
    });

    /**
     * Qualifiers tags update
     */
    const qualifiersFound = qualifiers.find();
    let qualifiersTag = "";
    for (let i = 0; i < qualifiersFound.length; i++) {
        const id = qualifiersFound[i].id;
        const name = qualifiersFound[i].name;
        //const actorTag = '<span class="tag" data-id="' + id + '" data-name="' + name + '" data-type="qualifier">' + name + '<i class="far fa-times-circle qualifier"></i></span>';
        const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one" data-id="' + id + '" data-name="' + name + '" data-type="qualifier">' + name + '</a>';
        qualifiersTag += actorTag;
    }
    document.querySelectorAll(".qualifiersTag").forEach((qualifierTag) => {
        qualifierTag.innerHTML = qualifiersTag;
    });


    /**
     * Relations update
     */
    const relationsFound = relations.find();
    let relationsList = "";
    for (let i = 0; i < relationsFound.length; i++) {
        const name = relationsFound[i].name;
        const code = relationsFound[i].code;
        const relationItem = '<span class="badge" data-code="' + code + '" data-name="' + name + '" data-type="relation">' + name + '</span>';
        relationsList += relationItem;
    }
    document.querySelector("#relationsList").innerHTML = relationsList;

    // Deletes an actor, must be call in update to bind new tags !
    // And MUST be called after tags update
    const tags = document.querySelectorAll(".tag");
    tags.forEach((tag) => {
        tag.addEventListener('click', (event) => {
            const element = event.currentTarget;

            if (element.parentNode.classList.contains("emettor")) {                
                document.querySelector("#emettor").dataset.id = element.dataset.id;
                document.querySelector("#emettor").dataset.name = element.dataset.name;
                element.classList.add("selected");
            }

            if (element.parentNode.classList.contains("qualifier")) {                
                document.querySelector("#qualifier").dataset.id = element.dataset.id;
                document.querySelector("#qualifier").dataset.name = element.dataset.name;
            }

            if (element.parentNode.classList.contains("receptor")) {                
                document.querySelector("#receptor").dataset.id = element.dataset.id;
                document.querySelector("#receptor").dataset.name = element.dataset.name;

                addRelation();
                emptyRelationChunks();
            }


            /*
                        if (element.dataset.type == 'actor') {
                            if (event.shiftKey) {
                                if (element.dataset.id) {
                                    actors.findAndRemove({ id: element.dataset.id });
                                    document.dispatchEvent(updateEvent);
                                }
                            } else if (event.ctrlKey) {
                                document.querySelector("#receptor").dataset.id = element.dataset.id;
                                document.querySelector("#receptor").dataset.name = element.dataset.name;
                            } else {
                                document.querySelector("#emettor").dataset.id = element.dataset.id;
                                document.querySelector("#emettor").dataset.name = element.dataset.name;
                            }
                        }
            
                        if (element.dataset.type == 'qualifier') {
                            if (event.shiftKey) {
                                if (element.dataset.id) {
                                    qualifiers.findAndRemove({ id: element.dataset.id });
                                }
                            }
                            document.querySelector("#qualifier").dataset.id = element.dataset.id;
                            document.querySelector("#qualifier").dataset.name = element.dataset.name;
                        }
            */

            document.dispatchEvent(updateEvent);
        });
    });
});