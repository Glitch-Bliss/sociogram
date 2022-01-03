

const GlobalService = require("./global.service.class");
const path = require('path');
const { emptyRelationChunks } = require("./utils.class");

// https://github.com/jgraph/mxgraph-js/tree/master/javascript/examples
// https://jgraph.github.io/mxgraph/docs/js-api/files/model/mxCell-js.html
class GraphTools {

    graph;
    mx;
    parent;
    doc;
    documents = [];
    container;

    constructor() {
    }

    init() {
        this.mx = require("mxgraph")({
            mxImageBasePath: "./mxgraph_sources/images",
            mxBasePath: "./mxgraph_sources"
        })

        this.container = document.querySelector(".graphContainer");
        this.container.innerHTML = "";

        // Creates the graph inside the given container
        this.graph = new this.mx.mxGraph(this.container);

        this.doc = this.mx.mxUtils.createXmlDocument();

        // We flush previous documents
        this.documents = [];

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        this.parent = this.graph.getDefaultParent();

        // Enables wrapping for vertex labels
        this.graph.isWrapping = (cell) => {
            return cell.vertex;
        };

        // Explain how to display cell labels from attributes
        this.graph.convertValueToString = (cell) => {
            return cell.getAttribute("name");
        };

        // Disable cells selection and egdes move
        this.graph.setEnabled(false);
        this.graph.setTooltips(true);
        this.graph.htmlLabels = true;

        // Sets global styles
        let style = this.graph.getStylesheet().getDefaultEdgeStyle();
        style[this.mx.mxConstants.STYLE_EDGE] = this.mx.mxEdgeStyle.ElbowConnector;
        style[this.mx.mxConstants.STYLE_ROUNDED] = true;
        // style[this.mx.mxConstants.STYLE_SPACING] = 10;
        // style[this.mx.mxConstants.STYLE_SPACING_TOP] = 10;
        // style[this.mx.mxConstants.STYLE_SPACING_BOTTOM] = 10;
        style[this.mx.mxConstants.STYLE_SHAPE] = this.mx.mxConstants.SHAPE_CONNECTOR;
        style[this.mx.mxConstants.STYLE_STROKECOLOR] = '#6482B9';
        style[this.mx.mxConstants.STYLE_ALIGN] = this.mx.mxConstants.ALIGN_CENTER;
        style[this.mx.mxConstants.STYLE_VERTICAL_ALIGN] = this.mx.mxConstants.ALIGN_MIDDLE;
        style[this.mx.mxConstants.STYLE_EDGE] = this.mx.mxEdgeStyle.ElbowConnector;
        style[this.mx.mxConstants.STYLE_ENDARROW] = this.mx.mxConstants.ARROW_CLASSIC;
        style[this.mx.mxConstants.STYLE_FONTSIZE] = '10';
        this.graph.getStylesheet().putDefaultEdgeStyle(style);

        // Autosize labels on insert where autosize=1
        this.graph.autoSizeCellsOnAdd = true;
        this.graph.autoSizeCells = true;

        // Enables panning with left mouse button
        this.graph.panningHandler.useLeftButtonForPanning = true;
        this.graph.panningHandler.ignoreCell = true;
        this.graph.setPanning(true);

        // Resizes the container
        this.graph.setResizeContainer(false);

        //Set the zoom factor
        this.graph.zoomFactor = 1.05;

        // Adding cell mouse listeners
        this.graph.addMouseListener(
            {
                mouseUp: function (sender, me) { },
                mouseDown: (sender, evt) => {
                    let cell = evt.getCell();
                    this.addCellClickListener(cell);
                },
                mouseMove: (sender, evt) => {
                    let cell = this.graph.view.getState(evt.getCell());
                    if (cell) {
                        // console.info("Tmp ? ", cell);
                    }
                }
            }
        );
    }


    /**
     * Emit a dom event when the cell is clicked, providing cell value (= xml form of the created doc)
     * @param {*} cell 
     */
    addCellClickListener(cell) {
        if (cell && cell.value) {
            const cellEvent = new CustomEvent("cellClick", {
                detail: cell.value
            });
            document.dispatchEvent(cellEvent);
        }
    }

    /**
     * We add a new document obj to the internal library, filling it's attribute from the json object provided
     * @param {*} type 
     * @param {*} object 
     * @returns 
     */
    addDocument(type, object) {
        let document = this.doc.createElement(type);
        this.documents[object.id] = { doc: document };

        for (let attribute in object) {
            try {
                if (typeof object[attribute] == 'object') {
                    object[attribute] = JSON.stringify(object[attribute]);
                }
                const name = attribute.replace(/[^a-zA-Z0-9]/g, '');
                document.setAttribute(name, object[attribute]);
            } catch (error) {
                console.warn(`An error occured when filling graph document for attribute ${attribute}`);
                console.error("error ", error);
            }
        }
        return document;
    }

    /**
     * Add icons depending on doc datas
     * @param {*} cell 
     * @param {*} doc 
     */
    addOverlay(cell, doc) {

        // If doc has a valid image
        if (doc.imageDataURL) {
            // Creates a new overlay with an image and a tooltip
            let overlay = new this.mx.mxCellOverlay(new this.mx.mxImage("./assets/img_icon.jpg", 15, 15), 'With image', this.mx.mxConstants.ALIGN_RIGHT, this.mx.mxConstants.ALIGN_TOP, { x: 3, y: -3 });
            overlay.cursor = 'pointer';

            // Does not work (yet ? :/ )
            overlay.addListener('mouseMove', (sender, evt2) => {
                console.info("hovered");
            });

            overlay.addListener(this.mx.mxEvent.CLICK, (sender, evt2) => {
                console.info("clicked");
            });

            // // Sets the overlay for the cell in the graph
            this.graph.addCellOverlay(cell, overlay);
        }
    }

    /**
     * Creates a new relation from three json objects
     * @param {*} from 
     * @param {*} by 
     * @param {*} to 
     */
    addRelationship(from, by, to) {

        let v1 = this.documents[from.id]?.graph;
        let v2 = this.documents[to.id]?.graph;
        let rel = this.documents[by.id]?.graph;

        let actor1 = this.documents[from.id]?.doc || this.addDocument("actor", from);
        let actor2 = this.documents[to.id]?.doc || this.addDocument("actor", to);
        let relation = this.documents[by.id]?.doc || this.addDocument("relation", by);

        let style = new Object();
        // style[this.mx.mxConstants.STYLE_SHAPE] = this.mx.mxConstants.SHAPE_IMAGE;
        // style[this.mx.mxConstants.STYLE_PERIMETER] = this.mx.mxPerimeter.RectanglePerimeter;
        // style[this.mx.mxConstants.STYLE_STROKECOLOR] = '#000000';
        // style[this.mx.mxConstants.STYLE_FONTCOLOR] = '#000000';
        // style[this.mx.mxConstants.STYLE_SHAPE] = this.mx.mxConstants.SHAPE_LABEL;
        // style[this.mx.mxConstants.STYLE_ALIGN] = this.mx.mxConstants.ALIGN_CENTER;
        // style[this.mx.mxConstants.STYLE_VERTICAL_ALIGN] = this.mx.mxConstants.ALIGN_TOP;
        // style[this.mx.mxConstants.STYLE_IMAGE_ALIGN] = this.mx.mxConstants.ALIGN_CENTER;
        // style[this.mx.mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = this.mx.mxConstants.ALIGN_TOP;
        // style[this.mx.mxConstants.STYLE_IMAGE] = 'images/icons48/gear.png';
        // style[this.mx.mxConstants.STYLE_IMAGE_WIDTH] = '48';
        // style[this.mx.mxConstants.STYLE_IMAGE_HEIGHT] = '48';
        // style[this.mx.mxConstants.STYLE_SPACING_TOP] = '56';
        style[this.mx.mxConstants.STYLE_SPACING] = '10';

        // @TODO add listener to after cell resize to set style

        try {
            this.graph.getModel().beginUpdate();
            v1 = v1 || this.graph.insertVertex(this.parent, null, actor1, 40, 40, 80, 30, from.id);
            this.addOverlay(v1, from);
            style = this.mx.mxUtils.clone(style);
            this.graph.getStylesheet().putCellStyle(from.id, style);

            this.documents[from.id].graph = v1;
            v2 = v2 || this.graph.insertVertex(this.parent, null, actor2, 40, 40, 80, 30, to.id);
            this.addOverlay(v2, to);
            style = this.mx.mxUtils.clone(style);
            this.graph.getStylesheet().putCellStyle(to.id, style);

            this.documents[to.id].graph = v2;
            rel = this.graph.insertEdge(this.parent, null, relation, v1, v2, 'verticalAlign=bottom');
            this.documents[by.id].graph = rel;
        } catch (error) {
            console.error(error);
        } finally {
            this.graph.getModel().endUpdate();

            const layout = new this.mx.mxHierarchicalLayout(this.graph);
            // this.mx.mxConstants.DIRECTION_WEST || this.mx.mxConstants.DIRECTION_NORTH;
            layout.orientation = this.mx.mxConstants.DIRECTION_WEST;
            layout.execute(this.parent);

            this.graph.center();
        }
    }

    addMouseListeners() {
        this.container.addEventListener('mouseover', () => {
            this.container.dataset.mouseover = true;
        });

        this.container.addEventListener('mouseout', () => {
            this.container.dataset.mouseover = false;
        });

        window.addEventListener('wheel', (event) => {
            if (this.container.dataset.mouseover == "true") {
                if (event.deltaY < 0) {
                    this.graph.zoomIn();
                } else {
                    this.graph.zoomOut();
                }
            }
        });
    }

    addLayoutButtons() {
        document.querySelector("#mxCircleLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxCircleLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxCompactTreeLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxCompactTreeLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxCompositeLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxCompositeLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxFastOrganicLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxFastOrganicLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxParallelEdgeLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxParallelEdgeLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxPartitionLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxPartitionLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxStackLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxStackLayout(this.graph);
            layout.execute(this.parent);
        });
        document.querySelector("#mxHierarchicalLayout").addEventListener('click', (event) => {
            const layout = new this.mx.mxHierarchicalLayout(this.graph);
            layout.orientation = this.mx.mxConstants.DIRECTION_WEST;
            layout.execute(this.parent);
        });
    }

}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new GraphTools();