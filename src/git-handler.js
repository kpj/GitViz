import FS from '@isomorphic-git/lightning-fs'
const git = require('isomorphic-git')

export async function parseGitRepository (repoUrl) {
  // prepare filesystem
  const fs = new FS('fs', { wipe: true })
  git.plugins.set('fs', fs)

  const pfs = fs.promises

  // prepare repo directory
  const dir = '/repo'
  await pfs.mkdir(dir)

  // clone repo
  console.log('Clone repository')
  await git.clone({
    dir,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: repoUrl,
    ref: 'master',
    singleBranch: true,
    noCheckout: true
  })

  // get data from repo
  console.log('Parse commits')
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
      await A.populateHash()
      await B.populateHash()

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
