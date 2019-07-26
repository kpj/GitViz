import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'

import { languageStyles, languageStylesDict } from './language-data'

export class Graph {
  constructor (repoUrl) {
    cytoscape.use(cola)

    this.cy = cytoscape({
      container: document.getElementById('container'),
      style: [...[
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            backgroundColor: 'gray'
          }
        },
        {
          selector: 'node[type="file"]',
          style: {
            shape: 'ellipse'
          }
        },
        {
          selector: 'node[type="directory"]',
          style: {
            shape: 'rectangle'
          }
        }
      ], ...languageStyles]
    })

    this.layout = undefined
  }

  blinkColor (nodeId, color, blinkDuration) {
    // set highlight color
    this.cy.getElementById(nodeId).style({
      backgroundColor: color
    })

    // revert to original color
    let origColor = languageStylesDict[this.cy.getElementById(nodeId).data('extension')] || 'gray' // this.cy.getElementById(nodeId).style('background-color')

    this.cy.getElementById(nodeId).animate({
      style: { backgroundColor: origColor }
    }, {
      duration: blinkDuration
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
      fit: true, // false
      infinite: true,
      randomize: false,
      ungrabifyWhileSimulating: true,
      nodeDimensionsIncludeLabels: true,
      // ready: () => {
      //   this.cy.fit()
      // }
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
          label: entry.label,
          type: entry.type,
          extension: entry.extension
        },
        position: entry.position || { x: 0, y: 0 }
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

    // add starting position to nodes with parent
    for (let n of addedNodes) {
      let parentId
      let parts = n.id.split('/')

      while (!existingNodesIds.has(parentId)) {
        parts.pop()
        parentId = parts.join('/') || '/'
      }

      n.position = Object.assign({}, this.cy.getElementById(parentId).position())
    }

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
  let allNodeIds = []
  let graphData = {
    nodes: [],
    edges: []
  }

  // add root node
  graphData.nodes.push({
    id: '/',
    label: '/',
    type: 'directory',
    extension: undefined
  })

  // add each file from commit as node
  for (let entry of files) {
    let fname = entry.path

    let prevRoot = ''
    let root = ''

    let parts = fname.split('/')
    for (let idx in parts) {
      let comp = parts[idx]

      if (comp.length === 0) {
        continue
      }

      root += '/' + comp
      if (allNodeIds.includes(root)) {
        prevRoot = root
        continue
      }
      allNodeIds.push(root)

      // parse file extension (undefined if no extension)
      let ext = comp.split('.').slice(1).pop()

      // store generated data
      graphData.nodes.push({
        id: root,
        label: comp,
        type: (parseInt(idx) === parts.length - 1) ? 'file' : 'directory',
        extension: ext
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
