import FS from '@isomorphic-git/lightning-fs'
const git = require('isomorphic-git')

export async function parseGitRepository (repoUrl) {
  // prepare filesystem
  let fs = new FS('fs', { wipe: true })
  git.plugins.set('fs', fs)

  let pfs = fs.promises

  // prepare repo directory
  const dir = '/repo'
  await pfs.mkdir(dir)

  // clone repo
  console.log('Start cloning')
  await git.clone({
    dir,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: repoUrl,
    ref: 'master',
    singleBranch: true
  })

  // get data from repo
  console.log('Getting commits')
  let commitList = await git.log({ dir })
  commitList.reverse()

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
