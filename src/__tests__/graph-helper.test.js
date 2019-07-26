import 'babel-polyfill'
import { convertFilesToTree } from '../graph-helper'

// deal with jest being unable to handle yaml files
// parcel normally bundles them for us
jest.mock('../languages.yml', () => 1)

// tests
test('construct basic tree', async () => {
  expect(await convertFilesToTree([
    { path: 'setup.py' },
    { path: 'project/main.py' },
    { path: 'project/utils.py' },
    { path: 'project/core/handler.py' }
  ])).toStrictEqual({
    nodes: [
      { id: '/', label: '/', type: 'directory', extension: undefined },
      { id: '/setup.py', label: 'setup.py', type: 'file', extension: 'py' },
      { id: '/project', label: 'project', type: 'directory', extension: undefined },
      { id: '/project/main.py', label: 'main.py', type: 'file', extension: 'py' },
      { id: '/project/utils.py', label: 'utils.py', type: 'file', extension: 'py' },
      { id: '/project/core', label: 'core', type: 'directory', extension: undefined },
      { id: '/project/core/handler.py', label: 'handler.py', type: 'file', extension: 'py' }
    ],
    edges: [
      { id: undefined, source: '/', target: '/setup.py' },
      { id: undefined, source: '/', target: '/project' },
      { id: undefined, source: '/project', target: '/project/main.py' },
      { id: undefined, source: '/project', target: '/project/utils.py' },
      { id: undefined, source: '/project', target: '/project/core' },
      { id: undefined, source: '/project/core', target: '/project/core/handler.py' }
    ]
  })
})
