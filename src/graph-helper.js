import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'

export class Graph {
  constructor (repoUrl) {
    cytoscape.use(cola)

    this.cy = cytoscape({
      container: document.getElementById('container'),
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            backgroundColor: 'gray'
          }
        }
      ]
    })

    this.layout = undefined
  }

  blinkColor (nodeId, color) {
    this.cy.getElementById(nodeId).style({
      backgroundColor: color
    })

    this.cy.getElementById(nodeId).animate({
      style: { backgroundColor: 'gray' }
    }, {
      duration: 1000
    })
  }

  render () {
    // stop old layout if necessary
    if (this.layout !== undefined) {
      this.layout.stop()
    }

    // create new layout
    this.layout = this.cy.layout({
      name: 'cola',
      fit: false,
      infinite: true,
      randomize: false
    })
    this.layout.run()
  }

  addNodes (nodes) {
    this.cy.startBatch()

    for (let entry of nodes) {
      this.cy.add({
        group: 'nodes',
        data: {
          id: entry.id,
          label: entry.label
        },
        position: { x: 0, y: 0 }
      })
    }

    this.cy.endBatch()
  }

  addEdges (edges) {
    this.cy.startBatch()

    for (let entry of edges) {
      this.cy.add({
        group: 'edges',
        data: {
          id: entry.id,
          source: entry.source,
          target: entry.target
        },
        position: { x: 0, y: 0 }
      })
    }

    this.cy.endBatch()
  }

  /**
   * Add new nodes/edges and remove stale ones
   */
  changeState (proposedNodes, edges) {
    // extract ids
    let existingNodesIds = new Set(this.cy.nodes().map(n => n.id()))
    let proposedNodeIds = new Set(proposedNodes.map(n => n.id))

    // check which nodes were added/removed
    let addedNodes = proposedNodes.filter(x => !existingNodesIds.has(x.id))
    let removedNodeIds = new Set(
      [...existingNodesIds].filter(x => !proposedNodeIds.has(x)))

    // check which edges were added
    let addedNodesIds = new Set(addedNodes.map(n => n.id))
    let newEdges = new Set(edges)
    let addedEdges = [...newEdges].filter(
      x => addedNodesIds.has(x.source) || addedNodesIds.has(x.target))

    console.log(addedNodes, addedEdges)
    console.log(removedNodeIds)

    // apply changes
    let somethingChanged = false

    // add new entities
    if (addedNodes.length) {
      this.addNodes(addedNodes)
      this.addEdges(addedEdges)

      somethingChanged = true
    }

    for (let n of addedNodes) {
      this.blinkColor(n.id, 'red')
    }

    // remove old nodes
    this.cy.startBatch()
    for (let nodeId of removedNodeIds) {
      // edges are removed automatically
      this.cy.getElementById(nodeId).remove()
      somethingChanged = true
    }
    this.cy.endBatch()

    return somethingChanged
  }

  clear () {
    if (this.layout !== undefined) {
      this.layout.stop()
    }

    this.cy.elements().remove()
  }
}

export async function convertFilesToTree (files) {
  let allNodes = []
  let graphData = {
    nodes: [],
    edges: []
  }

  // add root node
  graphData.nodes.push({
    id: '/',
    label: '/'
  })

  // add each file from commit as node
  for (let fname of files) {
    let prevRoot = ''
    let root = ''
    for (let comp of fname.split('/')) {
      root += '/' + comp
      if (allNodes.includes(comp)) {
        prevRoot = root
        continue
      }
      allNodes.push(comp)

      graphData.nodes.push({
        id: root,
        label: comp
      })
      graphData.edges.push({
        id: undefined,
        source: prevRoot === '' ? '/' : prevRoot,
        target: root
      })

      prevRoot = root
    }
  }
  return graphData
}
