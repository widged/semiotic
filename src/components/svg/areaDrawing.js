import { contourDensity } from "d3-contour"
import { scaleLinear } from "d3-scale"
import polylabel from "@mapbox/polylabel"
import { hexbin } from "d3-hexbin"

export function contouring({ areaType, data, finalXExtent, finalYExtent }) {
  let projectedAreas = []
  if (!areaType.type) {
    areaType = { type: areaType }
  }

  const {
    resolution = 500,
    thresholds = 10,
    bandwidth = 20,
    neighborhood
  } = areaType

  const xScale = scaleLinear()
    .domain(finalXExtent)
    .rangeRound([0, resolution])
    .nice()
  const yScale = scaleLinear()
    .domain(finalYExtent)
    .rangeRound([resolution, 0])
    .nice()

  data.forEach(contourData => {
    let contourProjectedAreas = contourDensity()
      .size([resolution, resolution])
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .thresholds(thresholds)
      .bandwidth(bandwidth)(contourData._xyfCoordinates)

    if (neighborhood) {
      contourProjectedAreas = [contourProjectedAreas[0]]
    }

    contourProjectedAreas.forEach(area => {
      area.parentArea = contourData
      area.bounds = []
      area.coordinates.forEach(poly => {
        poly.forEach((subpoly, i) => {
          poly[i] = subpoly.map(coordpair => {
            coordpair = [
              xScale.invert(coordpair[0]),
              yScale.invert(coordpair[1])
            ]
            return coordpair
          })
          //Only push bounds for the main poly, not its interior rings, otherwise you end up labeling interior cutouts
          if (i === 0) {
            area.bounds.push(shapeBounds(poly[i]))
          }
        })
      })
    })
    projectedAreas = [...projectedAreas, ...contourProjectedAreas]
  })

  return projectedAreas
}

export function hexbinning({
  areaType,
  data,
  finalXExtent,
  finalYExtent,
  size,
  xScaleType,
  yScaleType
}) {
  let projectedAreas = []
  if (!areaType.type) {
    areaType = { type: areaType }
  }

  const {
    //    binGraphic = "hex",
    bins = 0.05,
    cellPx,
    binValue = d => d.length
  } = areaType

  const hexBinXScale = xScaleType.domain(finalXExtent).range([0, size[0]])
  const hexBinYScale = yScaleType.domain(finalYExtent).range([0, size[1]])

  const actualResolution =
    (cellPx && cellPx / 2) || (bins > 1 ? 1 / bins : bins) * size[0] / 2

  const hexbinner = hexbin()
    .x(d => hexBinXScale(d._xyfPoint[0]))
    .y(d => hexBinYScale(d._xyfPoint[1]))
    .radius(actualResolution)
    .size(size)

  data.forEach(hexbinData => {
    const hexes = hexbinner(
      hexbinData._xyfCoordinates.map((d, i) => ({
        _xyfPoint: d,
        ...hexbinData.coordinates[i]
      }))
    )

    const hexMax = Math.max(...hexes.map(d => binValue(d)))

    //Option for blank hexe
    const hexBase = [
      [0, -1],
      [0.866, -0.5],
      [0.866, 0.5],
      [0, 1],
      [-0.866, 0.5],
      [-0.866, -0.5]
    ]

    const hexWidth = hexBinXScale.invert(actualResolution) - finalXExtent[0]
    const hexHeight = hexBinYScale.invert(actualResolution) - finalYExtent[0]

    const hexacoordinates = hexBase.map(d => [
      d[0] * hexWidth,
      d[1] * hexHeight
    ])

    const hexbinProjectedAreas = hexes.map(d => {
      const hexValue = binValue(d)
      const gx = d.x
      const gy = d.y
      d.x = hexBinXScale.invert(d.x)
      d.y = hexBinYScale.invert(d.y)
      d.binItems = d
      const percent = hexValue / hexMax
      return {
        customMark: areaType.customMark && (
          <g transform={`translate(${gx},${size[1] - gy})`}>
            {areaType.customMark({
              ...d,
              percent,
              value: hexValue,
              radius: actualResolution,
              hexCoordinates: hexBase.map(d => [
                d[0] * actualResolution,
                d[1] * actualResolution
              ])
            })}
          </g>
        ),
        _xyfCoordinates: hexacoordinates.map(p => [p[0] + d.x, p[1] + d.y]),
        value: hexValue,
        percent,
        data: d,
        parentArea: hexbinData,
        centroid: true
      }
    })
    projectedAreas = [...projectedAreas, ...hexbinProjectedAreas]
  })

  return projectedAreas
}

export function heatmapping({
  areaType,
  data,
  finalXExtent,
  finalYExtent,
  size,
  xScaleType,
  yScaleType
}) {
  let projectedAreas = []
  if (!areaType.type) {
    areaType = { type: areaType }
  }

  const {
    //    binGraphic = "square",
    binValue = d => d.length,
    xBins = areaType.yBins || 0.05,
    yBins = xBins,
    xCellPx = !areaType.xBins && areaType.yCellPx,
    yCellPx = !areaType.yBins && xCellPx
  } = areaType
  const xBinPercent = xBins < 1 ? xBins : 1 / xBins
  const yBinPercent = yBins < 1 ? yBins : 1 / yBins

  const heatmapBinXScale = xScaleType.domain(finalXExtent).range([0, size[0]])
  const heatmapBinYScale = yScaleType.domain(finalYExtent).range([size[1], 0])

  const actualResolution = [
    ((xCellPx && xCellPx / size[0]) || xBinPercent) * size[0],
    ((yCellPx && yCellPx / size[1]) || yBinPercent) * size[1]
  ]

  // const halfResolution = [actualResolution[0] / 2, actualResolution[1] / 2]

  data.forEach(heatmapData => {
    const grid = []
    const flatGrid = []

    let cell
    let gridColumn

    for (let i = 0; i < size[0]; i += actualResolution[0]) {
      const x = heatmapBinXScale.invert(i)
      const x1 = heatmapBinXScale.invert(i + actualResolution[0])

      gridColumn = []
      grid.push(gridColumn)
      for (let j = 0; j < size[1]; j += actualResolution[1]) {
        const y = heatmapBinYScale.invert(j)
        const y1 = heatmapBinYScale.invert(j + actualResolution[1])
        cell = {
          gx: i,
          gy: j,
          gw: actualResolution[0],
          gh: actualResolution[1],
          x: (x + x1) / 2,
          y: (y + y1) / 2,
          binItems: [],
          value: 0,
          _xyfCoordinates: [[x, y], [x1, y], [x1, y1], [x, y1]],
          parentArea: heatmapData
        }
        gridColumn.push(cell)
        flatGrid.push(cell)
      }
      gridColumn.push(cell)
    }
    grid.push(gridColumn)

    heatmapData._xyfCoordinates.forEach((d, di) => {
      const xCoordinate = parseInt(heatmapBinXScale(d[0]) / actualResolution[0])
      const yCoordinate = parseInt(heatmapBinYScale(d[1]) / actualResolution[1])
      grid[xCoordinate][yCoordinate].binItems.push(heatmapData.coordinates[di])
    })

    let maxValue = -Infinity

    flatGrid.forEach(d => {
      d.value = binValue(d.binItems)
      maxValue = Math.max(maxValue, d.value)
    })

    flatGrid.forEach(d => {
      d.percent = d.value / maxValue
      d.customMark = areaType.customMark && (
        <g transform={`translate(${d.gx},${d.gy})`}>{areaType.customMark(d)}</g>
      )
    })

    projectedAreas = [...projectedAreas, ...flatGrid]
  })

  return projectedAreas
}

export function shapeBounds(coordinates) {
  let left = [Infinity, 0]
  let right = [-Infinity, 0]
  let top = [0, Infinity]
  let bottom = [0, -Infinity]
  coordinates.forEach(d => {
    left = d[0] < left[0] ? d : left
    right = d[0] > right[0] ? d : right
    bottom = d[1] > bottom[1] ? d : bottom
    top = d[1] < top[1] ? d : top
  })

  return { center: polylabel([coordinates]), top, left, right, bottom }
}
