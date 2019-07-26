import languageData from './languages.yml'

export let languageStyles = []
export let languageStylesDict = {}

for (const [language, metaData] of Object.entries(languageData)) {
  // console.log(language, metaData.color, metaData.extensions)

  if (!('color' in metaData) || !('extensions' in metaData)) {
    continue
  }

  let curColor = metaData.color
  for (let curExtension of metaData.extensions) {
    let ext = curExtension.substr(1) // remove leading dot

    // append to selector list
    let tmp = {
      selector: `node[extension="${ext}"]`,
      style: {
        backgroundColor: curColor
      }
    }
    languageStyles.push(tmp)

    // add to basic dictionary
    languageStylesDict[ext] = curColor
  }
}
