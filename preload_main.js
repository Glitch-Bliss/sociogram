const fs = require('fs');
const path = require('path');
const os = require('os');
const { electron, ipcRenderer } = require('electron');
const { dialog } = require('electron');
const { serialize, deserialize } = require('v8');
const console = require("console");


document.addEventListener("DOMContentLoaded", () => {


    let mx = require("mxgraph")({
        mxImageBasePath: "./mxgraph_sources/images",
        mxBasePath: "./mxgraph_sources"
    })

    let container = document.getElementById("graphContainer");
    // Creates the graph inside the given container
    let graph = new mx.mxGraph(container);

    // Enables rubberband selection
    // new mx.mxRubberband(graph);

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    let parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    graph.getModel().beginUpdate();
    // Enables wrapping for vertex labels
    graph.isWrapping = function (cell) {
        return cell.vertex;
    };

    // Disable cells selection and egdes move
    graph.setEnabled(false);
    graph.setTooltips(true);
    graph.htmlLabels = true;
    // Autosize labels on insert where autosize=1
    graph.autoSizeCellsOnAdd = true;

    // Sets global styles
    let style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mx.mxConstants.STYLE_EDGE] = mx.mxEdgeStyle.ElbowConnector;
    style[mx.mxConstants.STYLE_ROUNDED] = true;

    // Resizes the container
    graph.setResizeContainer(true);

    try {
        let v1 = graph.insertVertex(parent, null,
            'Hello, a very long text it is ! Wow, so long ! Do you adapt your size ?', 20, 20, 80, 120);
        let v2 = graph.insertVertex(parent, null,
            'World!', 200, 150, 80, 30);
        let v3 = graph.insertVertex(parent, null,
            'toutout loutoutou', 20, 20, 80, 30);
        let v4 = graph.insertVertex(parent, null,
            'whattabuttit', 200, 150, 80, 30);
        let v5 = graph.insertVertex(parent, null,
            'pripipipi lala loulou', 20, 20, 80, 30);
        let v6 = graph.insertVertex(parent, null,
            'getup standup', 200, 150, 80, 30);
        let v7 = graph.insertVertex(parent, null,
            'chamou lhaya', 20, 20, 80, 30);
        let v8 = graph.insertVertex(parent, null,
            'patapontatra', 200, 150, 80, 30);
        let e1 = graph.insertEdge(parent, null, 'Oh ! Un text !', v1, v2, 'verticalAlign=bottom');
        let e2 = graph.insertEdge(parent, null, '', v2, v3);
        let e3 = graph.insertEdge(parent, null, '', v3, v4);
        let e4 = graph.insertEdge(parent, null, '', v6, v7);
        let e5 = graph.insertEdge(parent, null, '', v4, v5);
        let e7 = graph.insertEdge(parent, null, '', v8, v6);

    }
    finally {
        // Updates the display
        graph.getModel().endUpdate();

        const layout = new mx.mxHierarchicalLayout(graph);
        const orientation = mx.mxConstants.DIRECTION_WEST || mx.mxConstants.DIRECTION_NORTH;
        layout.orientation = mx.mxConstants.DIRECTION_WEST;
        layout.execute(parent);
    }

    document.querySelector("#mxCircleLayout").addEventListener('click', (event) => {
        const layout = new mx.mxCircleLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxCompactTreeLayout").addEventListener('click', (event) => {
        const layout = new mx.mxCompactTreeLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxCompositeLayout").addEventListener('click', (event) => {
        const layout = new mx.mxCompositeLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxFastOrganicLayout").addEventListener('click', (event) => {
        const layout = new mx.mxFastOrganicLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxParallelEdgeLayout").addEventListener('click', (event) => {
        const layout = new mx.mxParallelEdgeLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxPartitionLayout").addEventListener('click', (event) => {
        const layout = new mx.mxPartitionLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxStackLayout").addEventListener('click', (event) => {
        const layout = new mx.mxStackLayout(graph);
        layout.execute(parent);
    });
    document.querySelector("#mxHierarchicalLayout").addEventListener('click', (event) => {
        const layout = new mx.mxHierarchicalLayout(graph);
        layout.execute(parent);
    });

});


/**
 * Classes
 */
// const mermaidJs = require("./mermaidjs.class.js");
// const lokiDb = require("./lokiDb.class");
// const Utils = require("./utils.class");


// //We must declare it before requirement to allow functions to know it
// // let mermaidAPI = null;
// let randId = 0;
// let lastSVGID = "sociograph";

// /**
//  * Render mermaid graph from relations
//  */
// const renderGraph = () => {
//     const element = document.querySelector("#graph");
//     if (lokiDb.relations.find().length > 0) {
//         //To overcome a bug in api, first parameter has to be different each time, a random string do the job
//         randId++;
//         lastSVGID = "sociographe" + randId;
//         mermaidJs.render(lastSVGID, lokiDb.getGraphDefinition(), (svgCode, bindFunctions) => {
//             element.innerHTML = svgCode;

//             /**
//              * We bind clicks on nodes
//              */
//             element.querySelectorAll(".clickable").forEach((found) => {
//                 found.addEventListener("click", (event) => {
//                     console.info("clicked ", event.currentTarget.id);
//                 });
//             });
//         });
//     } else {
//         element.innerHTML = '';
//     }
// }

// /**
//  * App logic
//  */
// const updateEvent = new Event('update');

// const nodeClicked = (nodeId) => {
//     console.log("issi");
//     alert("Hello ?!");
// }


// document.addEventListener("DOMContentLoaded", () => {
//     document.dispatchEvent(updateEvent);

//     //Save img
//     document.querySelector("#save-image").addEventListener('click', (event) => {
//         event.preventDefault();

//         Utils.saveGraphToImage();

//     });

//     //Load configuration
//     document.querySelector("#load-configuration").addEventListener('click', (event) => {
//         event.preventDefault();

//         dialog.showOpenDialog({
//             buttonLabel: 'Ouvrir',
//             filters: [{ name: 'Fichiers Sociographers', extensions: ['sociographer'] }],
//             property: ['openFile']
//         }).then(result => {
//             try {
//                 let openedFile = fs.readFileSync(result.filePaths[0]);
//                 let jsonConfiguration = JSON.parse(openedFile);

//                 actors.removeDataOnly();
//                 actors.insert(jsonConfiguration.actors);
//                 qualifiers.removeDataOnly();
//                 qualifiers.insert(jsonConfiguration.qualifiers);
//                 relations.removeDataOnly();
//                 relations.insert(jsonConfiguration.relations);
//                 document.dispatchEvent(updateEvent);

//             } catch (error) {
//                 console.log(`Erreur lors de l'ouverture de ${result.filePaths[0]}`, error)
//                 const options = {
//                     type: 'error',
//                     title: 'Erreur d\'ouverture',
//                     message: `Erreur lors de l'ouverture de ${result.filePaths[0]}\n Message : ${error}`
//                 }
//                 dialog.showMessageBox(options, (index) => { });
//             }
//         })

//     });

//     //Save configuration
//     document.querySelector("#save-configuration").addEventListener('click', (event) => {
//         let jsonConfiguration = {
//             "actors": [],
//             "relations": [],
//             "qualifiers": []
//         };

//         actors.find().forEach((actor) => {
//             jsonConfiguration.actors.push({ 'name': actor.name, 'id': actor.id });
//         });
//         qualifiers.find().forEach((qualifier) => {
//             jsonConfiguration.qualifiers.push({ 'name': qualifier.name, 'id': qualifier.id });
//         });
//         relations.find().forEach((relation) => {
//             jsonConfiguration.relations.push({ 'name': relation.name, 'id': relation.id, 'code': relation.code });
//         });

//         dialog.showSaveDialog({
//             buttonLabel: 'Sauvegarder',
//             filters: [{ name: 'Fichier Sociographer', extensions: ['sociographer'] }],
//             property: ['createDirectory', 'showOverwriteConfirmation']
//         }).then(path => {
//             if (path && path.filePath) {

//                 const sgPath = path.filePath;
//                 let data = JSON.stringify(jsonConfiguration)

//                 fs.writeFile(sgPath, data, (error) => {
//                     let options = {};
//                     try {
//                         if (error) throw error
//                         options = {
//                             type: 'info',
//                             title: 'Information',
//                             message: `Le Sociographe ${sgPath} a bien été sauvegardé.`
//                         }
//                     } catch (error) {
//                         console.log(`Erreur lors de la sauvegarde de ${sgPath}: `, error)
//                         options = {
//                             type: 'error',
//                             title: 'Erreur d\'enregistrement',
//                             message: `Le Sociographe n'a PAS été sauvegardé. \n Message : ${error}`
//                         }
//                     } finally {
//                         dialog.showMessageBox(options, (index) => { });
//                     }
//                 })
//             }
//         })

//     });

//     document.querySelector("#button-actor").addEventListener('click', lokiDb.addsActor);
//     document.querySelector("#actorname").addEventListener('keyup', (event) => {
//         if (event.keyCode === 13) {
//             addsActor();
//             document.querySelector("#actorname").value = "";
//             document.querySelector("#actorname").focus();
//         }
//     });

//     document.querySelector("#button-qualifier").addEventListener('click', addsQualifier);
//     document.querySelector("#qualifiername").addEventListener('keyup', (event) => {
//         if (event.keyCode === 13) {
//             addsQualifier();
//             document.querySelector("#qualifiername").value = "";
//             document.querySelector("#qualifiername").focus();
//         }
//     });
// });



// let idActorSelected = {
//     "emettor": {
//         "list": null,
//         "id": null
//     },
//     "receptor": {
//         "list": null,
//         "id": null
//     }
// };
// let idQualifierSelected = null;

// document.addEventListener("update", () => {
//     /**
//      * Actors tags update
//      */
//     const actorsFound = lokiDb.actors.find();
//     let actorsTag = "";
//     for (let i = 0; i < actorsFound.length; i++) {
//         const id = actorsFound[i].id;
//         const name = actorsFound[i].name;
//         const selected = actorsFound[i].selected ? 'selected' : '';
//         const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="actor">' + name + '</a>';
//         actorsTag += actorTag;
//     }
//     document.querySelectorAll(".actorsTag").forEach((actorTagList) => {
//         actorTagList.innerHTML = actorsTag;
//         if (actorTagList.classList.contains("emettor")) {
//             actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
//                 if (actorTag.dataset.id == idActorSelected.emettor.id) {
//                     actorTag.classList.add("selected");
//                 }
//             });
//         }

//         if (actorTagList.classList.contains("receptor")) {
//             actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
//                 if (actorTag.dataset.id == idActorSelected.receptor.id) {
//                     actorTag.classList.add("selected");
//                 }
//             });
//         }
//     });

//     /**
//      * Qualifiers tags update
//      */
//     const qualifiersFound = lokiDb.qualifiers.find();
//     let qualifiersTag = "";
//     for (let i = 0; i < qualifiersFound.length; i++) {
//         const id = qualifiersFound[i].id;
//         const name = qualifiersFound[i].name;
//         const selected = idQualifierSelected == id ? 'selected' : '';
//         const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="qualifier">' + name + '</a>';
//         qualifiersTag += actorTag;
//     }
//     document.querySelectorAll(".qualifiersTag").forEach((qualifierTag) => {
//         qualifierTag.innerHTML = qualifiersTag;
//     });

//     /**
//      * Relations update
//      */
//     const relationsFound = lokiDb.relations.find();
//     let relationsList = "";
//     for (let i = 0; i < relationsFound.length; i++) {
//         const name = relationsFound[i].name;
//         const code = relationsFound[i].code;
//         const id = relationsFound[i].id;
//         const relationItem = '<div class="alert alert-success" role="alert" data-code="' + code + '" data-name="' + name + '" data-type="relation">' + name + '<div class="close" data-id="' + id + '"><i class="fas fa-times"></i></div></div>';
//         relationsList += relationItem;
//     }
//     document.querySelector("#relationsList").innerHTML = relationsList;

//     // Removes a relation
//     document.querySelectorAll(".close").forEach((closeButton) => {
//         closeButton.addEventListener('click', (event) => {
//             const id = event.currentTarget.dataset.id;
//             lokiDb.relations.findAndRemove({ id: id });
//             document.dispatchEvent(updateEvent);
//         });
//     });

//     // Creates a new relation when three buttons clicked
//     const tags = document.querySelectorAll(".tag");
//     tags.forEach((tag) => {
//         tag.addEventListener('click', (event) => {
//             event.preventDefault();
//             const element = event.currentTarget;

//             if (element.parentNode.classList.contains("emettor")) {
//                 if (event.ctrlKey) {
//                     lokiDb.actors.findAndRemove({ id: element.dataset.id });
//                 } else {
//                     document.querySelector("#emettor").dataset.id = element.dataset.id;
//                     document.querySelector("#emettor").dataset.name = element.dataset.name;
//                     idActorSelected.emettor.id = element.dataset.id;
//                 }
//             }

//             if (element.parentNode.classList.contains("qualifier")) {
//                 if (event.ctrlKey) {
//                     qualifiers.findAndRemove({ id: element.dataset.id });
//                 } else {
//                     document.querySelector("#qualifier").dataset.id = element.dataset.id;
//                     document.querySelector("#qualifier").dataset.name = element.dataset.name;
//                     idQualifierSelected = element.dataset.id;
//                 }
//             }

//             if (element.parentNode.classList.contains("receptor")) {
//                 if (event.ctrlKey) {
//                     lokiDb.actors.findAndRemove({ id: element.dataset.id });
//                 } else {
//                     document.querySelector("#receptor").dataset.id = element.dataset.id;
//                     document.querySelector("#receptor").dataset.name = element.dataset.name;

//                     idActorSelected.receptor.id = element.dataset.id;

//                     idActorSelected = {
//                         "emettor": {
//                             "id": null
//                         },
//                         "receptor": {
//                             "id": null
//                         }
//                     };

//                     idQualifierSelected = null;

//                     lokiDb.addRelation();
//                     Utils.emptyRelationChunks();
//                 }
//             }
//             document.dispatchEvent(updateEvent);
//         });
//     });

//     renderGraph();

//     /**
//      * Check visibility of buttons
//      */

//     const relationsVisibility = lokiDb.relations.find().length > 0;
//     const actorsVisibility = lokiDb.actors.find().length > 0;
//     const qualifierVisibility = lokiDb.qualifiers.find().length > 0;
//     document.getElementById("save-image").classList.toggle("visible", relationsVisibility);
//     document.getElementById("graph").classList.toggle("visible", relationsVisibility);
//     document.getElementById("save-configuration").classList.toggle("visible", actorsVisibility);
//     document.querySelectorAll(".actorTitle").forEach((title) => title.classList.toggle("visible", actorsVisibility));
//     document.querySelectorAll(".qualifierTitle").forEach((title) => title.classList.toggle("visible", qualifierVisibility));
//     document.querySelector(".help").classList.toggle("visible", !qualifierVisibility && !actorsVisibility && !relationsVisibility);
// });