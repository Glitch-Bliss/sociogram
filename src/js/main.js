

import '../scss/main.scss';
import { mermaidAPI } from 'mermaid';
import { Base64 } from 'js-base64';
import { saveSvgAsPng } from 'save-svg-as-png';

/**
 * LOKI JS
 */

const loki = require("lokijs");
const db = new loki("sociogram.db");
const actors = db.addCollection("actors");
const qualifiers = db.addCollection("qualifiers");
const relations = db.addCollection("relations");


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
    logLevel: 5,
    theme: "dark",
    themeCSS: ".edgeLabel {background-color: #e8e8e8;padding:2px; }"
};

let randId = 0;
let lastSVGID = "bidon";
function renderGraph() {
    const element = document.querySelector("#graph");
    if (relations.find().length > 0) {
        //To overcome a bug in api, first parameter has to be different each time, a random string do the job
        randId++;
        lastSVGID = "bidon" + randId;
        mermaidAPI.render(lastSVGID, buildGraph(), (svgCode, bindFunctions) => {
            element.innerHTML = svgCode;
        });
    } else {
        element.innerHTML = '';
    }

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
        const code = emettorElement.dataset.id + '(' + emettorElement.dataset.name + ') -->|' + qualifierElement.dataset.name + '| ' + receptorElement.dataset.id + '(' + receptorElement.dataset.name + ')';
        const name = emettorElement.dataset.name + ' ' + qualifierElement.dataset.name + ' ' + receptorElement.dataset.name;
        const id = Math.random().toString(36).substring(3);
        relations.insert({ code: code, name: name, id: id });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    mermaidAPI.initialize(mermaidConfig, "graph");
    document.dispatchEvent(updateEvent);

    //Save img
    document.querySelector("#save-image").addEventListener('click', (event) => {
        event.preventDefault();
        saveSvgAsPng(document.getElementById(lastSVGID), "sociogram-graph");
    });

    //Load configuration
    document.querySelector("#load-configuration").addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById("load-configuration-dialog").addEventListener('change', (event) => {
            const file = event.target.files;
            if (file[0]) {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    const jsonConfiguration = JSON.parse(event.target.result);
                    actors.removeDataOnly();
                    actors.insert(jsonConfiguration.actors);
                    qualifiers.removeDataOnly();
                    qualifiers.insert(jsonConfiguration.qualifiers);
                    relations.removeDataOnly();
                    relations.insert(jsonConfiguration.relations);
                    document.dispatchEvent(updateEvent);
                });
                const jsonFile = reader.readAsText(file[0]);
            }
        }, false);
        document.getElementById("load-configuration-dialog").click();
    });

    //Save configuration
    document.querySelector("#save-configuration").addEventListener('click', (event) => {
        let jsonConfiguration = {
            "actors": [],
            "relations": [],
            "qualifiers": []
        };

        actors.find().forEach((actor) => {
            jsonConfiguration.actors.push({ 'name': actor.name, 'id': actor.id });
        });
        qualifiers.find().forEach((qualifier) => {
            jsonConfiguration.qualifiers.push({ 'name': qualifier.name, 'id': qualifier.id });
        });
        relations.find().forEach((relation) => {
            jsonConfiguration.relations.push({ 'name': relation.name, 'id': relation.id, 'code': relation.code });
        });

        event.target.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonConfiguration));
        event.target.download = 'sociogram-configuration.json';
    });


    // Adds an actor
    function addsActor() {
        const name = document.querySelector("#actorname").value;
        if (name) {
            const id = Math.random().toString(36).substring(3);
            if (actors.find({ name: name }).length == 0) {
                actors.insert({ name: name, id: id });
            }
        }
        document.dispatchEvent(updateEvent);
    }
    document.querySelector("#button-actor").addEventListener('click', addsActor);
    document.querySelector("#actorname").addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            addsActor();
            document.querySelector("#actorname").value = "";
            document.querySelector("#actorname").focus();
        }
    });

    // Adds qualifier
    function addsQualifier() {
        const name = document.querySelector("#qualifiername").value;
        if (name) {
            const id = Math.random().toString(36).substring(3);
            if (qualifiers.find({ name: name }).length == 0) {
                qualifiers.insert({ name: name, id: id });
            }
        }
        document.dispatchEvent(updateEvent);
    }
    document.querySelector("#button-qualifier").addEventListener('click', addsQualifier);
    document.querySelector("#qualifiername").addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            addsQualifier();
            document.querySelector("#qualifiername").value = "";
            document.querySelector("#qualifiername").focus();
        }
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

let idActorSelected = {
    "emettor": {
        "list": null, "id": null
    },
    "receptor": {
        "list": null, "id": null
    }
};
let idQualifierSelected = null;
document.addEventListener("update", () => {
    /**
     * Actors tags update
     */
    const actorsFound = actors.find();
    let actorsTag = "";
    for (let i = 0; i < actorsFound.length; i++) {
        const id = actorsFound[i].id;
        const name = actorsFound[i].name;
        const selected = actorsFound[i].selected ? 'selected' : '';
        const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="actor">' + name + '</a>';
        actorsTag += actorTag;
    }
    document.querySelectorAll(".actorsTag").forEach((actorTagList) => {
        actorTagList.innerHTML = actorsTag;
        if (actorTagList.classList.contains("emettor")) {
            actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
                if (actorTag.dataset.id == idActorSelected.emettor.id) {
                    actorTag.classList.add("selected");
                }
            });
        }

        if (actorTagList.classList.contains("receptor")) {
            actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
                if (actorTag.dataset.id == idActorSelected.receptor.id) {
                    actorTag.classList.add("selected");
                }
            });
        }
    });

    /**
     * Qualifiers tags update
     */
    const qualifiersFound = qualifiers.find();
    let qualifiersTag = "";
    for (let i = 0; i < qualifiersFound.length; i++) {
        const id = qualifiersFound[i].id;
        const name = qualifiersFound[i].name;
        const selected = idQualifierSelected == id ? 'selected' : '';
        const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="qualifier">' + name + '</a>';
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
        const id = relationsFound[i].id;
        const relationItem = '<div class="alert alert-success" role="alert" data-code="' + code + '" data-name="' + name + '" data-type="relation">' + name + '<div class="close" data-id="' + id + '"><i class="fas fa-times"></i></div></div>';
        relationsList += relationItem;
    }
    document.querySelector("#relationsList").innerHTML = relationsList;

    // Removes a relation
    document.querySelectorAll(".close").forEach((closeButton) => {
        closeButton.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.id;
            relations.findAndRemove({ id: id });
            document.dispatchEvent(updateEvent);
        });
    });

    // Creates a new relation when three buttons clicked
    const tags = document.querySelectorAll(".tag");
    tags.forEach((tag) => {
        tag.addEventListener('click', (event) => {
            event.preventDefault();
            const element = event.currentTarget;

            if (element.parentNode.classList.contains("emettor")) {
                if (event.ctrlKey) {
                    actors.findAndRemove({ id: element.dataset.id });
                } else {
                    document.querySelector("#emettor").dataset.id = element.dataset.id;
                    document.querySelector("#emettor").dataset.name = element.dataset.name;
                    idActorSelected.emettor.id = element.dataset.id;
                }
            }

            if (element.parentNode.classList.contains("qualifier")) {
                if (event.ctrlKey) {
                    qualifiers.findAndRemove({ id: element.dataset.id });
                } else {
                    document.querySelector("#qualifier").dataset.id = element.dataset.id;
                    document.querySelector("#qualifier").dataset.name = element.dataset.name;
                    idQualifierSelected = element.dataset.id;
                }
            }

            if (element.parentNode.classList.contains("receptor")) {
                if (event.ctrlKey) {
                    actors.findAndRemove({ id: element.dataset.id });
                } else {
                    document.querySelector("#receptor").dataset.id = element.dataset.id;
                    document.querySelector("#receptor").dataset.name = element.dataset.name;

                    idActorSelected.receptor.id = element.dataset.id;

                    idActorSelected = {
                        "emettor": {
                            "id": null
                        },
                        "receptor": {
                            "id": null
                        }
                    };

                    idQualifierSelected = null;

                    addRelation();
                    emptyRelationChunks();
                }
            }
            document.dispatchEvent(updateEvent);
        });
    });

    renderGraph();

    /**
     * Check download button visibility     
     */

    const relationsVisibility = relations.find().length > 0;
    const actorsVisibility = actors.find().length > 0;
    const qualifierVisibility = qualifiers.find().length > 0;
    document.getElementById("save-image").classList.toggle("visible", relationsVisibility);
    document.getElementById("graph").classList.toggle("visible", relationsVisibility);
    document.querySelectorAll(".actorTitle").forEach((title) => title.classList.toggle("visible", actorsVisibility));
    document.querySelectorAll(".qualifierTitle").forEach((title) => title.classList.toggle("visible", qualifierVisibility));
    document.querySelector(".help").classList.toggle("visible", !qualifierVisibility && !actorsVisibility && !relationsVisibility);
});