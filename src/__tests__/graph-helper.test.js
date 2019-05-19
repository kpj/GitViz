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
      { id: '/', label: '/' },
      { id: '/setup.py', label: 'setup.py' },
      { id: '/project', label: 'project' },
      { id: '/project/main.py', label: 'main.py' },
      { id: '/project/utils.py', label: 'utils.py' },
      { id: '/project/core', label: 'core' },
      { id: '/project/core/handler.py', label: 'handler.py' }
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
