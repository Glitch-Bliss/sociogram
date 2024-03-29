// import '../scss/main.scss';
require = require("esm")(module, { "mode": "auto" })

const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer } = require('electron');
const { dialog } = require('electron');
const { serialize, deserialize } = require('v8');
const { saveSvgAsPng } = require('save-svg-as-png');
const console = require("console");


// const mermaid = require('mermaid');

/**
 * Classes
 */
const lokiDb = require("./lokiDb.class");


//We must declare it before requirement to allow functions to know it
let mermaidAPI = null;
let randId = 0;
let lastSVGID = "sociograph";

/**
 * Initialize and configure Mermaid
 */
const getMermaidAPI = () => {
    if (!mermaidAPI) {

        const mermaidConfig = {
            startOnLoad: false,
            htmlLabels: true,
            callback: function (id) { },
            flowchart: {
                useMaxWidth: true,
            },
            logLevel: 5,
            theme: "dark",
            themeCSS: ".edgeLabel {background-color: black;padding:2px; }"
        };

        mermaidAPI = require('mermaid');
        mermaidAPI.initialize(mermaidConfig, "graph");
    }
    return mermaidAPI;
}

/**
 * Render mermaid graph from relations
 */
const renderGraph = () => {
    const element = document.querySelector("#graph");
    if (lokiDb.relations.find().length > 0) {
        //To overcome a bug in api, first parameter has to be different each time, a random string do the job
        randId++;
        lastSVGID = "sociographe" + randId;
        getMermaidAPI().render(lastSVGID, buildGraph(), (svgCode, bindFunctions) => {
            element.innerHTML = svgCode;

            /**
             * We bind clicks on nodes
             */
            element.querySelectorAll(".clickable").forEach((found) => {
                found.addEventListener("click", (event) => {
                    console.info("clicked ", event.currentTarget.id);
                });
            });
        });
    } else {
        element.innerHTML = '';
    }
}

/**
 * App logic
 */
const updateEvent = new Event('update');

const nodeClicked = (nodeId) => {
    console.log("issi");
    alert("Hello ?!");
}

/**
 * Build mermaid string graph object
 */
const buildGraph = () => {
    let graphDefinition = 'graph TB\n';
    const relationsFound = lokiDb.relations.find();
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
 * Insert a new relation in noSQL Loki table
 */
const addRelation = () => {
    const emettorElement = document.querySelector("#emettor");
    const receptorElement = document.querySelector("#receptor");
    const qualifierElement = document.querySelector("#qualifier");

    if (emettorElement.dataset.id && receptorElement.dataset.id && qualifierElement.dataset.id) {
        let code = emettorElement.dataset.id + '(' + emettorElement.dataset.name + ') -->|' + qualifierElement.dataset.name + '| ' + receptorElement.dataset.id + '(' + receptorElement.dataset.name + ')\n';
        const name = emettorElement.dataset.name + ' ' + qualifierElement.dataset.name + ' ' + receptorElement.dataset.name;
        const id = Math.random().toString(36).substring(3);
        lokiDb.relations.insert({ code: code, name: name, id: id, emettorId: emettorElement.dataset.id, receptorId: receptorElement.dataset.id });
    }
}

/**
 * Needed to avoid the svg classes bug in saveSvgAsPng
 * thanks to https://github.com/mermaid-js/mermaid/issues/146
 * @param {*} id 
 */
const inlineCSStoSVG = (id) => {
    var nodes = document.querySelectorAll("#" + id + " *");
    for (var i = 0; i < nodes.length; ++i) {
        var elemCSS = window.getComputedStyle(nodes[i], null);
        nodes[i].removeAttribute('xmlns');
        nodes[i].style.fill = elemCSS.fill;
        nodes[i].style.fillOpacity = elemCSS.fillOpacity;
        nodes[i].style.stroke = elemCSS.stroke;
        nodes[i].style.strokeLinecap = elemCSS.strokeLinecap;
        nodes[i].style.strokeDasharray = elemCSS.strokeDasharray;
        nodes[i].style.strokeWidth = elemCSS.strokeWidth;
        nodes[i].style.fontSize = elemCSS.fontSize;
        nodes[i].style.fontFamily = elemCSS.fontFamily;
        //Solution to embbed HTML in foreignObject https://stackoverflow.com/a/37124551
        if (nodes[i].nodeName === "SPAN") {
            nodes[i].setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(updateEvent);

    //Save img
    document.querySelector("#save-image").addEventListener('click', (event) => {
        event.preventDefault();

        inlineCSStoSVG(lastSVGID);
        saveSvgAsPng(document.getElementById(lastSVGID), "sociographer.png");

    });

    //Load configuration
    document.querySelector("#load-configuration").addEventListener('click', (event) => {
        event.preventDefault();

        dialog.showOpenDialog({
            buttonLabel: 'Ouvrir',
            filters: [{ name: 'Fichiers Sociographers', extensions: ['sociographer'] }],
            property: ['openFile']
        }).then(result => {
            try {
                let openedFile = fs.readFileSync(result.filePaths[0]);
                let jsonConfiguration = JSON.parse(openedFile);

                actors.removeDataOnly();
                actors.insert(jsonConfiguration.actors);
                qualifiers.removeDataOnly();
                qualifiers.insert(jsonConfiguration.qualifiers);
                relations.removeDataOnly();
                relations.insert(jsonConfiguration.relations);
                document.dispatchEvent(updateEvent);

            } catch (error) {
                console.log(`Erreur lors de l'ouverture de ${result.filePaths[0]}`, error)
                const options = {
                    type: 'error',
                    title: 'Erreur d\'ouverture',
                    message: `Erreur lors de l'ouverture de ${result.filePaths[0]}\n Message : ${error}`
                }
                dialog.showMessageBox(options, (index) => { });
            }
        })

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

        dialog.showSaveDialog({
            buttonLabel: 'Sauvegarder',
            filters: [{ name: 'Fichier Sociographer', extensions: ['sociographer'] }],
            property: ['createDirectory', 'showOverwriteConfirmation']
        }).then(path => {
            if (path && path.filePath) {

                const sgPath = path.filePath;
                let data = JSON.stringify(jsonConfiguration)

                fs.writeFile(sgPath, data, (error) => {
                    let options = {};
                    try {
                        if (error) throw error
                        options = {
                            type: 'info',
                            title: 'Information',
                            message: `Le Sociographe ${sgPath} a bien été sauvegardé.`
                        }
                    } catch (error) {
                        console.log(`Erreur lors de la sauvegarde de ${sgPath}: `, error)
                        options = {
                            type: 'error',
                            title: 'Erreur d\'enregistrement',
                            message: `Le Sociographe n'a PAS été sauvegardé. \n Message : ${error}`
                        }
                    } finally {
                        dialog.showMessageBox(options, (index) => { });
                    }
                })
            }
        })

    });


    // Adds an actor
    function addsActor() {
        const name = document.querySelector("#actorname").value;
        if (name) {
            const id = "actor" + Math.random().toString(36).substring(3);
            if (lokiDb.actors.find({ name: name }).length == 0) {
                lokiDb.actors.insert({ name: name, id: id });
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
            if (lokiDb.qualifiers.find({ name: name }).length == 0) {
                lokiDb.qualifiers.insert({ name: name, id: id });
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
        "list": null,
        "id": null
    },
    "receptor": {
        "list": null,
        "id": null
    }
};
let idQualifierSelected = null;
document.addEventListener("update", () => {


    /**
     * Actors tags update
     */
    const actorsFound = lokiDb.actors.find();
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
    const qualifiersFound = lokiDb.qualifiers.find();
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
    const relationsFound = lokiDb.relations.find();
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
            lokiDb.relations.findAndRemove({ id: id });
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
                    lokiDb.actors.findAndRemove({ id: element.dataset.id });
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
                    lokiDb.actors.findAndRemove({ id: element.dataset.id });
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
     * Check visibility of buttons
     */

    const relationsVisibility = lokiDb.relations.find().length > 0;
    const actorsVisibility = lokiDb.actors.find().length > 0;
    const qualifierVisibility = lokiDb.qualifiers.find().length > 0;
    document.getElementById("save-image").classList.toggle("visible", relationsVisibility);
    document.getElementById("graph").classList.toggle("visible", relationsVisibility);
    document.getElementById("save-configuration").classList.toggle("visible", actorsVisibility);
    document.querySelectorAll(".actorTitle").forEach((title) => title.classList.toggle("visible", actorsVisibility));
    document.querySelectorAll(".qualifierTitle").forEach((title) => title.classList.toggle("visible", qualifierVisibility));
    document.querySelector(".help").classList.toggle("visible", !qualifierVisibility && !actorsVisibility && !relationsVisibility);
});