import 'babel-polyfill'
import { convertFilesToTree } from '../graph-helper'

test('construct basic tree', async () => {
  expect(await convertFilesToTree([
    { path: 'setup.py' },
    { path: 'project/main.py' },
    { path: 'project/utils.py' },
    { path: 'project/core/handler.py' }
  ])).toStrictEqual({
    nodes: [
      { id: '/', label: '/', type: 'directory' },
      { id: '/setup.py', label: 'setup.py', type: 'file' },
      { id: '/project', label: 'project', type: 'directory' },
      { id: '/project/main.py', label: 'main.py', type: 'file' },
      { id: '/project/utils.py', label: 'utils.py', type: 'file' },
      { id: '/project/core', label: 'core', type: 'directory' },
      { id: '/project/core/handler.py', label: 'handler.py', type: 'file' }
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
