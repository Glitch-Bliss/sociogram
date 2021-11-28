// https://github.com/jgraph/mxgraph-js/tree/master/javascript/examples
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

        // Autosize labels on insert where autosize=1
        this.graph.autoSizeCellsOnAdd = true;

        // Sets global styles
        let style = this.graph.getStylesheet().getDefaultEdgeStyle();
        style[this.mx.mxConstants.STYLE_EDGE] = this.mx.mxEdgeStyle.ElbowConnector;
        style[this.mx.mxConstants.STYLE_ROUNDED] = true;

        // Enables panning with left mouse button
        this.graph.panningHandler.useLeftButtonForPanning = true;
        this.graph.panningHandler.ignoreCell = true;
        this.graph.setPanning(true);

        // Resizes the container
        this.graph.setResizeContainer(false);

        // Adding cell click listener
        this.graph.addListener(this.mx.mxEvent.CLICK, function (sender, evt) {
            let cell = evt.getProperty('cell');
            console.info("sender", sender);
            console.info("event", evt);
            console.info(cell);
        });

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
                document.setAttribute(attribute, object[attribute]);
            } catch (error) {
                console.warn(`An error occured when filling graph document for attribute ${attribute}`);
            }
        }
        return document;
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

        try {
            this.graph.getModel().beginUpdate();

            v1 = v1 || this.graph.insertVertex(this.parent, null, actor1, 40, 40, 80, 30);
            this.documents[from.id].graph = v1;
            v2 = v2 || this.graph.insertVertex(this.parent, null, actor2, 40, 40, 80, 30);
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
            layout.execute(this.parent);
        });
    }

}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new GraphTools();