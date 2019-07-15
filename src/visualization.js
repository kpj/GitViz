import 'babel-polyfill' // ReferenceError: regeneratorRuntime is not defined

import { convertFilesToTree, Graph } from './graph-helper'

function timer (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// parsing
const gitWorker = new Worker('git-handler.js')

gitWorker.onmessage = e => {
  if (e.data.type === 'result') {
    buildNetwork(e.data.data, e.data.state)
  } else if (e.data.type === 'progress') {
    document.getElementById('progress').textContent = e.data.text
  } else {
    console.log('Unknown data:', e.data)
  }
}

function buildNetwork (data, state) {
  Promise.all(data.map(async entry => {
    return {
      commit: entry['commit'],
      tree: await convertFilesToTree(
        entry['files'].filter(e => e.type !== 'remove')),
      changedFiles: entry['files'].filter(e => e.type === 'modify')
    }
  })).then(data => render(data, state))
}

function render (data, state) {
  console.log(data, state)
  console.log('Creating graph')
  document.getElementById('header').textContent = `${state.repoUrl} @ ${state.gitBranch}`

  // setup network
  let g = new Graph()
  console.log(g)

  // construct graph for first commit
  let cur = data.shift()
  g.addNodes(cur.tree.nodes)
  g.addEdges(cur.tree.edges)

  g.render()

  store.commit('addCommit', cur.commit)

  // iterate over following commits
  let delay = state.iterationDuration
  const iterate = async () => {
    await timer(delay)
    for (let cur of data) {
      console.log(cur.commit.oid)
      store.commit('addCommit', cur.commit)

      if (g.changeState(cur.tree.nodes, cur.tree.edges)) {
        g.render()
      }

      for (let file of cur.changedFiles) {
        g.blinkColor(file.path, 'red', state.iterationDuration)
      }

      await timer(delay)
    }
  }
  iterate()
}

var store // weird global variable to access state of GUI
export function createVisualization (localStore) {
  // TODO: how to properly pass store? Webworkers make things difficult...
  store = localStore

  let state = store.state.config
  console.log('State:', store.state.config)
  gitWorker.postMessage(state)
}
