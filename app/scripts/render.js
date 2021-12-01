import * as d3 from 'd3'
import { HOVER_RADIUS, SVG_CONFIG } from "./config";
import { areTheSameSubstation, decodeSegment, decodeSubstation, encodeSubstation } from "./encoders";
import { clickOnStation, hoverOnStation } from "./interactions";
import { renderPanel } from './panel';
import { getState, getSubway } from './config';
import { DEFAULT_TEXT_OFFSET, EN_TRANSLATE, getTextOffsetDict } from './textOffset';
import { generateArcPathForSubstation, generateCirclePath, getStationsFromSegment, padArray } from "./utils";

const { viewbox } = SVG_CONFIG
const PATH_THAT_COVERS_ALL = `M ${viewbox[0]} ${viewbox[1]} H ${viewbox[2]} V ${viewbox[3]} H ${viewbox[0]} Z`

export const render = () => {

    const state = getState()
    const { palette, splineTension, useWigglyCurves } = state
    const { gStationsOverlay, gLinesOverlay, gLinesAmbient } = state.els
    const { stations, lines } = state.subway

    // Determine background color
    let baseColors = state.animating ? palette.backgroundWhileAnimating : palette.background
    document.body.style.backgroundColor = state.darkMode ? baseColors[0] : baseColors[1]

    d3.select("body").classed("animating", state.animating).classed("light-background", !state.darkMode)
    renderPanel()

    gStationsOverlay
        .selectAll('path')
        .data(d => {
            const status = state.activeStations.has(d)
            const dat = stations.dict[d].parentLines.map(pl => encodeSubstation(d, pl, status))
            return dat
        })
        .join(
            enter => enter.append("path")
                .attr("class", 'overlaid-station')
                .classed('active', sub => decodeSubstation(sub).st)
                .classed('center', sub => state.centerStation && areTheSameSubstation(sub, state.centerStation))
                .classed('interchange', sub => {
                    const { name } = decodeSubstation(sub)
                    return stations.dict[name].parentLines.length > 1
                })
                .attr('d', sub => {
                    return generateArcPathForSubstation(sub, false)
                })
                .attr("fill", sub => {
                    const { pl } = decodeSubstation(sub)
                    return lines.dict[pl].color
                }),
            update => update
                .classed("active", sub => decodeSubstation(sub).st)
                .classed('center', sub => state.centerStation && areTheSameSubstation(sub, state.centerStation))
        )

    gLinesOverlay
        .selectAll('path')
        .data([...state.activeLineSegments], d => d)
        .join(
            enter => enter.append('path')
                .transition()
                .attr('stroke', rawD => lines.dict[decodeSegment(rawD).lineId].color)
                .attr('stroke-width', state.animating ? 30 : 5)
                .attr('fill', 'transparent')
                .attr('d', rawD => {
                    const segment = decodeSegment(rawD)
                    // Freestyle line drawing!
                    let activeStations = useWigglyCurves ?['阎村东', segment.from, segment.to, '顺义'] : getStationsFromSegment(segment, true)
                    return d3.line().curve(d3.curveCardinalOpen.tension(splineTension))(activeStations.map(name => {
                        const s = stations.dict[name]
                        return [s.x, s.y]
                    }))
                })
        )

    gLinesAmbient
        .selectAll('path')
        .data(state.animating ? [...state.activeLineSegments] : [])
        .join(
            enter => enter.append('path')
                .transition()
                .attr('stroke', 'white')
                .attr('stroke-width', 130)
                .attr('stroke-linecap', 'square')
                // .attr('stroke-linejoin', 'round')
                .attr('fill', 'transparent')
                .attr('d', rawD => {
                    const segment = decodeSegment(rawD)
                    let activeStations = getStationsFromSegment(segment, true)
                    return d3.line().curve(d3.curveCardinalOpen.tension(splineTension))(activeStations.map(name => {
                        const s = stations.dict[name]
                        return [s.x, s.y]
                    }))
                })
        )
}

export const renderTextOn = g => {
    const { stations } = getSubway()
    const { palette, showStationNameOnMap } = getState()
    const offsetDict = getTextOffsetDict()
    const stationsToRenderText = stations.list.filter(name => {
        if (Math.random() > showStationNameOnMap) return false
        return !stations.dict[name].isAux && stations.dict[name].parentLines.length === 1
    })

    // Append group of base text
    const gStationsText = g
        .selectAll('svg')
        .data(stationsToRenderText)
        .join('svg')
        .attr('x', name => stations.dict[name].x)
        .attr('y', name => stations.dict[name].y)

    const texts = gStationsText.html("").append("g").attr('fill', palette.dimColor)

    // Chinese Station Names
    texts.append('text')
        .attr('class', 'station-text zh-cn')
        .text(d => d)
        .each(function (d) {
            const offsetConfig = offsetDict[d] || DEFAULT_TEXT_OFFSET
            d3.select(this)
                .attr("x", offsetConfig.x)
                .attr('y', offsetConfig.y)
                .attr('text-anchor', offsetConfig.anchor)
        })
    // Translated (in linguistics, not computer graphics) Station Names
    texts.append('text')
        .attr('class', 'station-text en-us')
        .text(d => stations.dict[d].translation)
        .each(function (d) {
            const offsetConfig = offsetDict[d] || DEFAULT_TEXT_OFFSET
            d3.select(this)
                .attr("x", offsetConfig.x)
                .attr('y', offsetConfig.y + EN_TRANSLATE)
                .attr('text-anchor', offsetConfig.anchor)
        })
}


export const renderLineBaseOn = g => {

    const { stations, lines } = getSubway()
    const { useAuxStations, splineTension } = getState()

    g.selectAll('path')
        .data(lines.list)
        .join('path')
        .attr('d', lineId => {
            let line = lines.dict[lineId]
            if (line.loop) {
                return d3.line().curve(d3.curveCardinalClosed.tension(splineTension))(
                    line.stations
                        .filter(name => {
                            if (useAuxStations) return true
                            return !stations.dict[name].isAux
                        })
                        .map(name => [
                            stations.dict[name].x,
                            stations.dict[name].y
                        ])
                )
            } else {
                return d3.line().curve(d3.curveCardinalOpen.tension(splineTension))(
                    padArray(line.stations, false)
                        .filter(name => {
                            if (useAuxStations) return true
                            return !stations.dict[name].isAux
                        })
                        .map(name => [
                            stations.dict[name].x,
                            stations.dict[name].y
                        ])
                )
            }
        })
        .attr("stroke", lineId => lines.dict[lineId].color)
        .attr("stroke-width", 1)
        .attr("fill", 'none')
        .attr('clip-path', 'url(#line-clip)')

}

export const renderLineClipsOn = gClipped => {
    const { stations } = getSubway()
    const interchanges = stations.list.filter(name => {
        const { isAux, parentLines } = stations.dict[name]
        return (!isAux) && parentLines.length > 1
    })
    const allInterchangesPath = interchanges.reduce((accu, curr) => {
        const { x, y, parentLines } = stations.dict[curr]
        return `${accu} ${generateCirclePath(x, y, parentLines.length * 3 + 9)}`
    }, PATH_THAT_COVERS_ALL)
    gClipped.append('path')
        .attr('d', allInterchangesPath)
        .attr('clip-rule', 'evenodd') // Something interesting is hiding here
}

export const renderVoronoiClipsOn = (gClipped, g) => {
    const { stations } = getSubway()
    const allStationsPath = stations.list.reduce((accu, curr) => {
        const { x, y, parentLines } = stations.dict[curr]
        return `${accu} ${generateCirclePath(x, y, HOVER_RADIUS)}`
    }, '')
    g.append('path')
        .attr('class', 'g-voronoi-clouds')
        .attr('d', allStationsPath)
        .attr('fill', 'olive')
        .attr('opacity', 0.1)
    gClipped.append('path').attr('d', allStationsPath)
}

export const renderStationInteractiveOn = g => {
    const { stations } = getSubway()
    const substationList = stations.list
        .filter(name => !stations.dict[name].isAux)
        .map(
            name => stations.dict[name].parentLines.map(
                pl => encodeSubstation(name, pl)
            )
        ).flat()
    const coordsList = substationList.map(sub => {
        const { name } = decodeSubstation(sub)
        const { parentLines, x, y } = stations.dict[name]
        const nLines = parentLines.length
        if (nLines === 1) return [x, y]
        return generateArcPathForSubstation(sub, true)
    })
    const delaunay = d3.Delaunay.from(coordsList)
    const voronoi = delaunay.voronoi(viewbox)
    const gStationsInteractiveArea = g.append('g')
        .attr('class', 'g-interactive-area')

    // Append voronoi lines, not rendered by default
    gStationsInteractiveArea
        .append('path')
        .attr('class', 'voronoi-lines')
        .attr('d', voronoi.render())
        .attr('fill', 'transparent')
        .attr('stroke', 'olive')
        .attr('stroke-width', 1)
        .attr('clip-path', 'url(#voronoi-clip)')

    // Append the true interactive area
    gStationsInteractiveArea
        .append('path')
        .attr('class', 'interactive-rect')
        .attr('d', PATH_THAT_COVERS_ALL)
        .attr('fill', 'transparent')
        .attr('clip-path', 'url(#voronoi-clip)')
        .on('mousemove', ev => {
            const [mx, my] = d3.pointer(ev)
            const destSub = substationList[delaunay.find(mx, my)]
            hoverOnStation(true, destSub)
        })
        .on('mouseleave', () => {
            hoverOnStation(false)
        })
        .on('click', ev => {
            const [mx, my] = d3.pointer(ev)
            const destSub = substationList[delaunay.find(mx, my)]
            clickOnStation(destSub)
        })
}
