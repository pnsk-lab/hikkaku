import { readFileSync } from 'node:fs'

type Vertex3 = readonly [number, number, number]
type Face3 = readonly [number, number, number]
type Edge2 = readonly [number, number]

const SIMPLIFY_VOXEL_SIZE = 0.2
const TARGET_RADIUS = 78

const parseObj = (source: string) => {
  const vertices: Vertex3[] = []
  const faces: Face3[] = []

  const lines = source.split(/\r?\n/)
  for (const line of lines) {
    if (line.startsWith('v ')) {
      const [, rawX, rawY, rawZ] = line.trim().split(/\s+/)
      if (!rawX || !rawY || !rawZ) {
        continue
      }
      const x = Number(rawX)
      const y = Number(rawY)
      const z = Number(rawZ)
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        continue
      }
      vertices.push([x, y, z])
      continue
    }

    if (!line.startsWith('f ')) {
      continue
    }

    const tokens = line.trim().split(/\s+/).slice(1)
    if (tokens.length < 3) {
      continue
    }

    const indices: number[] = []
    for (const token of tokens) {
      const raw = token.split('/')[0]
      if (!raw) {
        continue
      }
      const index = Number(raw)
      if (!Number.isInteger(index) || index === 0) {
        continue
      }
      indices.push(index - 1)
    }

    if (indices.length < 3) {
      continue
    }

    const anchor = indices[0]
    for (let i = 1; i < indices.length - 1; i += 1) {
      const b = indices[i]
      const c = indices[i + 1]
      if (anchor === undefined || b === undefined || c === undefined) {
        continue
      }
      faces.push([anchor, b, c])
    }
  }

  return { vertices, faces }
}

const simplifyMesh = (
  sourceVertices: ReadonlyArray<Vertex3>,
  sourceFaces: ReadonlyArray<Face3>,
  voxelSize: number,
) => {
  const clusters = new Map<
    string,
    {
      id: number
      sumX: number
      sumY: number
      sumZ: number
      count: number
      members: number[]
    }
  >()

  for (let index = 0; index < sourceVertices.length; index += 1) {
    const vertex = sourceVertices[index]
    if (!vertex) {
      continue
    }
    const [x, y, z] = vertex
    const key = [
      Math.round(x / voxelSize),
      Math.round(y / voxelSize),
      Math.round(z / voxelSize),
    ].join(',')

    let cluster = clusters.get(key)
    if (!cluster) {
      cluster = {
        id: clusters.size,
        sumX: 0,
        sumY: 0,
        sumZ: 0,
        count: 0,
        members: [],
      }
      clusters.set(key, cluster)
    }

    cluster.sumX += x
    cluster.sumY += y
    cluster.sumZ += z
    cluster.count += 1
    cluster.members.push(index)
  }

  const vertexToCluster = new Array<number>(sourceVertices.length)
  const simplifiedVertices: Array<Vertex3> = []

  for (const cluster of clusters.values()) {
    const vertex: Vertex3 = [
      cluster.sumX / cluster.count,
      cluster.sumY / cluster.count,
      cluster.sumZ / cluster.count,
    ]
    simplifiedVertices.push(vertex)

    for (const member of cluster.members) {
      vertexToCluster[member] = cluster.id
    }
  }

  const edges = new Set<string>()
  const addEdge = (a: number, b: number) => {
    if (a === b) {
      return
    }
    const from = a < b ? a : b
    const to = a < b ? b : a
    edges.add(`${from},${to}`)
  }

  for (const [a, b, c] of sourceFaces) {
    const ia = vertexToCluster[a]
    const ib = vertexToCluster[b]
    const ic = vertexToCluster[c]

    if (ia === undefined || ib === undefined || ic === undefined) {
      continue
    }
    if (ia === ib || ib === ic || ic === ia) {
      continue
    }

    addEdge(ia, ib)
    addEdge(ib, ic)
    addEdge(ic, ia)
  }

  const simplifiedEdges: Edge2[] = [...edges]
    .map((edge) => {
      const [rawA, rawB] = edge.split(',')
      return [Number(rawA), Number(rawB)] as const
    })
    .sort((lhs, rhs) => {
      if (lhs[0] !== rhs[0]) {
        return lhs[0] - rhs[0]
      }
      return lhs[1] - rhs[1]
    })

  return {
    vertices: simplifiedVertices,
    edges: simplifiedEdges,
  }
}

const normalizeVertices = (
  vertices: ReadonlyArray<Vertex3>,
  targetRadius: number,
) => {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY

  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const [x, y, z] of vertices) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z

    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }

  const centerX = (minX + maxX) * 0.5
  const centerY = (minY + maxY) * 0.5
  const centerZ = (minZ + maxZ) * 0.5

  let maxAbs = 1
  for (const [x, y, z] of vertices) {
    const absMax = Math.max(
      Math.abs(x - centerX),
      Math.abs(y - centerY),
      Math.abs(z - centerZ),
    )
    if (absMax > maxAbs) {
      maxAbs = absMax
    }
  }

  const scale = targetRadius / maxAbs
  return vertices.map((vertex) => {
    const [x, y, z] = vertex
    return [
      Number(((x - centerX) * scale).toFixed(3)),
      Number(((y - centerY) * scale).toFixed(3)),
      Number(((z - centerZ) * scale).toFixed(3)),
    ] as const
  })
}

const teapotObjSource = readFileSync(
  new URL('./teapot.obj', import.meta.url),
  'utf8',
)
const parsedObj = parseObj(teapotObjSource)
const simplifiedMesh = simplifyMesh(
  parsedObj.vertices,
  parsedObj.faces,
  SIMPLIFY_VOXEL_SIZE,
)

export const TEAPOT_VERTICES: ReadonlyArray<readonly [number, number, number]> =
  normalizeVertices(simplifiedMesh.vertices, TARGET_RADIUS)

export const TEAPOT_EDGES: ReadonlyArray<readonly [number, number]> =
  simplifiedMesh.edges
