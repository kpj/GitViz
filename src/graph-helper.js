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
            'label': 'data(label)'
          }
        }
      ]
    })

    this.layout = undefined
  }

  render () {
    this.layout = this.cy.layout({
      name: 'cola',
      fit: false,
      infinite: true
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
