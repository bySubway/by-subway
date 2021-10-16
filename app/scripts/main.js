import * as d3 from 'd3'
import { SVG_CONFIG } from './config'
import { onReset } from './interactions'
import { render, renderLineBaseOn, renderLineClipsOn, renderStationInteractiveOn, renderTextOn, renderVoronoiClipsOn } from './render'
import { getState } from './config'
import { initControls } from './panel'

d3.json('./data/subway.json').then(subway => {

    const state = getState()
    state.subway = subway
    const { lines, stations } = subway

    const svg = d3.select('svg-frame')
        .append('svg')
        .attr('viewbox', SVG_CONFIG.viewbox)
        .attr('id', 'root')

    const defs = svg.append('defs')

    // Add g, the top layer group
    const g = svg.append('g').attr('id', 'g').attr('class', 'top-layer-g')

    // Add zoom interaction
    const zoom = d3.zoom()
        .scaleExtent([0.1, 2])
        .on('zoom', el => g.attr('transform', el.transform))
    svg.call(zoom)

    const gText = g.append('g').attr('class', 'g-text')
    const gLineBase = g.append('g').attr('class', 'g-line-base')
    renderTextOn(gText)
    renderLineBaseOn(gLineBase)

    // Append the group of lines (overlay & base)
    const gLinesAmbient = g.append('g').attr('class', 'g-lines-ambient')
    const gLinesOverlay = g.append('g').attr('class', 'g-lines-overlay').attr('clip-path', 'url(#line-clip)')

    // Append the group of clip-paths for lines and the voronoi mesh
    const gClipped = defs.append('clipPath').attr('id', 'line-clip')
    renderLineClipsOn(gClipped)
    const gClippedVoronoi = defs.append('clipPath').attr('id', 'voronoi-clip')
    renderVoronoiClipsOn(gClippedVoronoi, g)

    // Append the group of stations
    const gStations = g.append('g')
        .attr('class', 'g-stations')
        .selectAll('svg')
        .data(stations.list.filter(name => !stations.dict[name].isAux))
        .join('svg')
        .attr('x', name => stations.dict[name].x)
        .attr('y', name => stations.dict[name].y)

    renderStationInteractiveOn(g)

    // Append the overlay group for each station
    const gStationsOverlay = gStations.append('g')

    d3.select('#reset').on('click', onReset)

    state.els = {
        ...state.els,
        svg, g, gStationsOverlay, gLinesAmbient, gLinesOverlay, gText, gLineBase
    }

    render()
    initControls()
})