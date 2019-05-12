import 'babel-polyfill' // ReferenceError: regeneratorRuntime is not defined

import { parseGitRepository } from './src/git-handler'
import { convertFilesToTree, Graph } from './src/graph-helper'

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

  let curData = data[0]
  g.addNodes(curData.tree.nodes)
  g.addEdges(curData.tree.edges)

  g.render()

  console.log(g)
})
