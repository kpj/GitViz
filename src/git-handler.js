import 'babel-polyfill' // ReferenceError: regeneratorRuntime is not defined

import FS from '@isomorphic-git/lightning-fs'
import EventEmitter from 'events'
const git = require('isomorphic-git')

self.onmessage = e => {
  parseGitRepository(e.data.repoUrl, e.data.gitBranch).then(data => {
    postMessage({ type: 'result', data: data, state: e.data })
  })
}

let log = text => {
  postMessage({
    type: 'progress',
    text: text
  })
}

export async function parseGitRepository (repoUrl, branch) {
  const emitter = new EventEmitter()

  // prepare filesystem
  const fs = new FS('fs', { wipe: true })
  git.plugins.set('fs', fs)
  git.plugins.set('emitter', emitter)

  const pfs = fs.promises

  // prepare repo directory
  const dir = '/repo'
  await pfs.mkdir(dir)

  // clone repo
  console.log('Cloning repository')
  log('Cloning repository')

  const onProgress = async progress => {
    // console.log(progress)
    log(`${progress.phase} [${progress.loaded}/${progress.total}]`)
  }

  emitter.on('progress', onProgress)
  await git.clone({
    dir,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: repoUrl,
    ref: branch,
    singleBranch: true,
    noCheckout: true
  })
  emitter.off('progress', onProgress)

  // get data from repo
  console.log('Parsing commits')
  log('Parsing commits')
  const commitList = await git.log({ dir })
  commitList.reverse()

  let data = []

  let firstCommit = commitList[0]
  data.push({
    commit: firstCommit,
    files: await git.listFiles(
      { dir: dir, ref: firstCommit.oid }
    ).then(data => {
      return data.map(e => ({
        path: `/${e}`,
        type: 'equal'
      }))
    })
  })

  for (let i = 0; i < commitList.length - 1; i++) {
    let curCommit = commitList[i]
    let nextCommit = commitList[i + 1]

    const files = await getFileStateChanges(curCommit.oid, nextCommit.oid, dir)

    data.push({
      commit: nextCommit,
      files
    })

    // update progress display
    log(`Comparing commits [${i + 1}/${commitList.length - 1}]`)
  }

  return data
}

async function getFileStateChanges (commitHash1, commitHash2, dir) {
  return git.walkBeta1({
    trees: [
      git.TREE({ dir: dir, ref: commitHash1 }),
      git.TREE({ dir: dir, ref: commitHash2 })
    ],
    map: async function ([A, B]) {
      // ignore directories
      if (A.fullpath === '.') {
        return
      }
      await A.populateStat()
      if (A.type === 'tree') {
        return
      }
      await B.populateStat()
      if (B.type === 'tree') {
        return
      }

      // generate ids
      await Promise.all([A.populateHash(), B.populateHash()])

      // determine modification type
      let type = 'equal'
      if (A.oid !== B.oid) {
        type = 'modify'
      }
      if (A.oid === undefined) {
        type = 'add'
      }
      if (B.oid === undefined) {
        type = 'remove'
      }
      if (A.oid === undefined && B.oid === undefined) {
        console.log('Something weird happened:')
        console.log(A)
        console.log(B)
      }

      return {
        path: `/${A.fullpath}`,
        type: type
      }
    }
  })
}
