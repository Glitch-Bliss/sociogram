

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
        { "name": "actor1", "tagId": 1 },
        { "name": "actor2", "tagId": 2 }
    ],
    "relations": [
        { "name": "actor1 aime actor2", "code": "1[acteur1] -->|aime| 2[acteur2]" },
        { "name": "actor2 déteste actor1", "code": "2[acteur2] -->|aime| 1[acteur1]" },
    ],
    "qualifiers": [
        { "name": "aime", "tagId": 3 },
        { "name": "déteste", "tagId": 4 }
    ]
};

jsonTest.actors.forEach((actor) => {    
    actors.insert({name: actor.name});
});

jsonTest.qualifiers.forEach((qualifier) => {    
    qualifiers.insert({name: qualifier.name});
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

document.addEventListener("DOMContentLoaded", () => {
    mermaidAPI.initialize(mermaidConfig, "graph");

    //Pevent forms to try submitting
    document.querySelectorAll("form").forEach((form) => {
        form.addEventListener('submit', (event) => event.preventDefault());
    });

    // Adds an actor
    document.querySelector("#button-actor").addEventListener('click', (event) => {
        const name = document.querySelector("#actorname").value;
        if (name) {
            actors.insert({ name: name });
        }
        document.dispatchEvent(updateEvent);
    });

    // Adds qualifier
    document.querySelector("#button-qualifier").addEventListener('click', (event) => {
        const name = document.querySelector("#qualifiername").value;
        if (name) {
            qualifiers.insert({ name: name });
        }
        document.dispatchEvent(updateEvent);
    });

    // Adds relation
    document.querySelector('#button-relation').addEventListener('click', (event) => {

        const emettorId = document.querySelector("#actorsSelect").value;
        const emettor = document.querySelector("#actorsSelect").options[document.querySelector("#actorsSelect").selectedIndex].text;
        const qualifier = document.querySelector("#qualifiersSelect").options[document.querySelector("#qualifiersSelect").selectedIndex].text;
        const receptorId = document.querySelector("#receptorSelect").value;
        const receptor = document.querySelector("#receptorSelect").options[document.querySelector("#receptorSelect").selectedIndex].text;

        const code = emettorId + '[' + emettor + '] -->|' + qualifier + '| ' + receptorId + '[' + receptor + ']';
        const name = emettor + ' ' + qualifier + ' ' + receptor;
        relations.insert({ code: code });
        renderGraph();
        document.dispatchEvent(updateEvent);
    });
});

document.addEventListener("update", () => {

    /**
     * Actors tags update
     */
    const actorsFound = actors.find();
    let actorsTag = "";
    let actorsOptions = "";
    for (let i = 0; i < actorsFound.length; i++) {
        const id = actorsFound[i].$loki;
        const name = actorsFound[i].name;
        const actorTag = '<span class="tag badge" id="' + id + '">' + name + '<i class="far fa-times-circle"></i></span>';
        actorsTag += actorTag;
        const actorOption = '<option value="' + id + '">' + name + '</option>';
        actorsOptions += actorOption;
    }
    document.querySelector("#actorsTag").innerHTML = actorsTag;
    document.querySelector("#actorsSelect").innerHTML = actorsOptions;
    document.querySelector("#receptorSelect").innerHTML = actorsOptions;

    /**
     * Qualifiers tags update
     */
    const qualifiersFound = qualifiers.find();
    let qualifiersTag = "";
    let qualifiersOptions = "";
    for (let i = 0; i < qualifiersFound.length; i++) {
        const id = qualifiersFound[i].$loki;
        const name = qualifiersFound[i].name;
        const actorTag = '<span class="tag badge" id="' + id + '">' + name + '<i class="far fa-times-circle"></i></span>';
        qualifiersTag += actorTag;
        const actorOption = '<option value="' + id + '">' + name + '</option>';
        qualifiersOptions += actorOption;
    }
    document.querySelector("#qualifiersTag").innerHTML = qualifiersTag;
    document.querySelector("#qualifiersSelect").innerHTML = qualifiersOptions;


    // Deletes an actor, must be call in update to bind new tags !
    // And MUST be called after tags update
    const tags = document.querySelectorAll(".tag");
    tags.forEach((tag) => {
        tag.addEventListener('click', (event) => {
            const id = event.currentTarget.id;
            if (id) {
                actors.remove({ $loki: id });
            }
            document.dispatchEvent(updateEvent);
        });
    });

});