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

  // construct graph for first commit
  let cur = data.shift()
  g.addNodes(cur.tree.nodes)
  g.addEdges(cur.tree.edges)

  g.render()

  // iterate over following commits
  let delay = 2000
  const iterate = async () => {
    await timer(delay)
    for (let cur of data) {
      console.log(cur.commit.oid)

      if (g.changeState(cur.tree.nodes, cur.tree.edges)) {
        g.render()
      }

      await timer(delay)
    }
  }
  iterate()
})
