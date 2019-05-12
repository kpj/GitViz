import 'babel-polyfill'
import FS from '@isomorphic-git/lightning-fs'

import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'

const git = require('isomorphic-git')

async function parseGitRepository (repoUrl, fs) {
  const dir = '/repo'
  await fs.mkdir(dir)

  console.log('Start cloning')
  await git.clone({
    dir,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: repoUrl,
    ref: 'master',
    singleBranch: true
  })

  console.log('Getting commits')
  let commitList = await git.log({ dir })

  let data = []
  for (let commit of commitList) {
    let files = await git.listFiles({ dir: dir, ref: commit.oid })
    data.push({
      commit,
      files
    })
  }

  return data
}

async function convertFilesToGraph (files) {
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

// setup
window.fs = new FS('fs', { wipe: true })
git.plugins.set('fs', window.fs)

window.pfs = window.fs.promises

// parsing
parseGitRepository(
  'https://github.com/kpj/project_manager', window.pfs
).then(data => {
  return Promise.all(data.map(async entry => {
    return {
      commit: entry['commit'],
      tree: await convertFilesToGraph(entry['files'])
    }
  }))
}).then(data => {
  console.log(data)
  console.log('Creating graph')

  // setup network
  cytoscape.use(cola)
  let cy = cytoscape({
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

  // add nodes
  cy.startBatch()
  cy.add({
    group: 'nodes',
    data: {
      id: '/',
      label: '/'
    },
    position: { x: 0, y: 0 }
  })

  let curData = data[0]
  for (let entry of curData.tree.nodes) {
    cy.add({
      group: 'nodes',
      data: {
        id: entry.id,
        label: entry.label
      },
      position: { x: 0, y: 0 }
    })
  }

  // add edges
  for (let entry of curData.tree.edges) {
    cy.add({
      group: 'edges',
      data: {
        id: entry.id,
        source: entry.source,
        target: entry.target
      },
      position: { x: 0, y: 0 }
    })
  }
  cy.endBatch()

  let layout = cy.layout({
    name: 'cola',
    fit: false,
    infinite: true
  })
  layout.run()

  console.log(cy)
})
