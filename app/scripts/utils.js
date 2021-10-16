import * as d3 from "d3"
import { decodeSubstation } from './encoders'
import { AIRPORT_LINE_ID } from './config'
import { getState, getSubway } from "./config"

export const generateCirclePath = (cx, cy, r) => {
    return `M ${cx} ${cy} m -${r}, 0 a ${r}, ${r} 0 1, 0 ${r * 2}, 0 a ${r}, ${r} 0 1 ,0 -${r * 2}, 0`
}

export const padArray = arr => arr.length ? [
    arr[0],
    ...arr,
    arr[arr.length - 1]
] : []

const findClosestPairs = (arr, start, end) => {

    const l = arr.length
    let res = {
        distance: Number.POSITIVE_INFINITY,
        indices: []
    }

    // Init: the non-existing 'prev occurrence -1'
    let p = 0
    let q = 0
    while (q < l) {
        // Move q to the next occurrence
        if (arr[q] !== end) q++
        else {
            // q is in place
            while (p < q) {
                // Do the same for p
                if (arr[p] !== start) p++
                else {
                    // Now we've got a new (p, q) both at occurrence
                    // Store and update if the distance is shorter
                    if (q - p < res.distance) {
                        res = {
                            distance: q - p,
                            indices: [p, q]
                        }
                    }
                    p++
                }
            }
            q++
        }
    }

    return res
}

export const findClosestPairsBidirectional = (arr, start, end) => {
    const [dirA, dirB] = [
        findClosestPairs(arr, start, end),
        findClosestPairs(arr, end, start)
    ];
    const resDir = dirA.distance < dirB.distance ? dirA : dirB
    return resDir.indices
}

export const getStationsFromSegment = (segm, withPadding) => {
    const { lines } = getSubway()
    let { lineId, from, to } = segm
    let allStations, iFrom, iTo

    if (lines.dict[lineId].loop || lineId === AIRPORT_LINE_ID) {
        allStations = padArray([...lines.dict[lineId].stations, ...lines.dict[lineId].stations]);
        [iFrom, iTo] = findClosestPairsBidirectional(allStations, from, to)
    }

    else {
        allStations = padArray(lines.dict[lineId].stations)
        if (allStations.indexOf(from) > allStations.indexOf(to)) [from, to] = [to, from];
        iFrom = allStations.lastIndexOf(from) // Avoid using indexOf() because of possible duplicate iFroms on the head
        iTo = allStations.indexOf(to)
    }

    return withPadding
        ? allStations.slice(iFrom - 1, iTo + 2)
        : allStations.slice(iFrom, iTo + 1)
}

export const generateArcPathForSubstation = (sub, returnCentroid) => {
    const { stations } = getSubway()
    const { name, pl } = decodeSubstation(sub)

    // Generate arc-objects using d3.pie (see https://github.com/d3/d3-shape#pie)

    // Arcsmap contains 'static' arc definitions (params about constant styles), while
    // targetArc contains 'dynamic' arc definitions (params about starting angle, etc.)
    // When called passing targetArc, dynamic definitions are merged with the static ones
    // to produce the final arc for the specific substation.

    const pieSectionArcs = d3.pie().value(d => 1)(stations.dict[name].parentLines)
    const targetArc = pieSectionArcs.find(arc => arc.data == pl)

    const nLines = stations.dict[name].parentLines.length
    const arcsMap = {
        1: d3.arc().innerRadius(0).outerRadius(3),
        2: d3.arc().innerRadius(4).outerRadius(11).cornerRadius(3).padAngle(0.3),
        3: d3.arc().innerRadius(5).outerRadius(13).cornerRadius(3).padAngle(0.3)
    }

    // Sometimes, we need the centroid primarily to determine metrics about interactive areas for each sub
    if (returnCentroid) {
        const centroid = arcsMap[nLines].startAngle(targetArc.startAngle).endAngle(targetArc.endAngle).centroid()
        const offsetCentroid = [
            centroid[0] + stations.dict[name].x,
            centroid[1] + stations.dict[name].y
        ]
        return offsetCentroid
    }

    return arcsMap[nLines](targetArc)
}

export const setSavedTimeout = (fn, t) => {
    const { triggers } = getState()
    const tId = setTimeout(fn, t)
    triggers.push(tId)
    return tId
}

export const clearAllSavedTimeouts = () => {
    const state = getState()
    state.triggers.forEach(tId => clearTimeout(tId))
    state.triggers = []
}