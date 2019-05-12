import 'babel-polyfill' // ReferenceError: regeneratorRuntime is not defined

import { parseGitRepository } from './src/git-handler'
import { convertFilesToTree, Graph } from './src/graph-helper'

function timer (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// parsing
parseGitRepository(
  'https://github.com/kpj/project_manager'
).then(data => {
  return Promise.all(data.map(async entry => {
    return {
      commit: entry['commit'],
      tree: await convertFilesToTree(entry['files'])
    }
  }))
}).then(data => {
  console.log(data)
  console.log('Creating graph')

  // setup network
  let g = new Graph()
  console.log(g)

  const iterate = async () => {
    for (let cur of data) {
      console.log(cur.commit.oid)
      g.clear()

      g.addNodes([{ id: '/', label: '/' }])
      g.addNodes(cur.tree.nodes)
      g.addEdges(cur.tree.edges)

      g.render()
      await timer(3000)
    }
  }
  iterate()
})
