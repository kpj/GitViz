import 'babel-polyfill' // ReferenceError: regeneratorRuntime is not defined

import { parseGitRepository } from './git-handler'
import { convertFilesToTree, Graph } from './graph-helper'

function timer (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatCommit (commit) {
  console.log(commit)
  let date = new Date(commit.committer.timestamp * 1000)

  var year = date.getFullYear()
  var month = (date.getMonth() + 1).toString().padStart(2, '0') // lol@+1
  var day = date.getDate().toString().padStart(2, '0')
  var hours = date.getHours().toString().padStart(2, '0')
  var minutes = date.getMinutes().toString().padStart(2, '0')
  var seconds = date.getSeconds().toString().padStart(2, '0')

  let dateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

  return `${dateStr} -- ${commit.message}`
}

// parsing
export function createVisualization (state) {
  console.log('State:', state)

  // start procedure
  parseGitRepository(
    state.repoUrl, state.gitBranch
  ).then(data => {
    return Promise.all(data.map(async entry => {
      return {
        commit: entry['commit'],
        tree: await convertFilesToTree(
          entry['files'].filter(e => e.type !== 'remove')),
        changedFiles: entry['files'].filter(e => e.type === 'modify')
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
    document.getElementById('header').innerHTML = formatCommit(cur.commit)

    // iterate over following commits
    let delay = state.iterationDuration
    const iterate = async () => {
      await timer(delay)
      for (let cur of data) {
        console.log(cur.commit.oid)
        document.getElementById('header').innerHTML = formatCommit(cur.commit)

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
  })
}
