import * as d3 from 'd3'
import { decodeSubstation, encodeSegment, encodeSegmentBySubstations, encodeSubstation } from './encoders'
import { render } from './render'
import { getState } from './config'
import { setSavedTimeout } from './utils'

export const clearActiveEls = () => {

    const state = getState()
    state.activeStations.clear()
    state.activeStationsListed.clear()
    state.activeLineSegments.clear()

}

export const updateActiveEls = (startingNode, clicked) => {

    const { playbackSpeed, costAllowed, subway, activeStations, activeLineSegments } = getState()

    // The recorded maximum timeout, for determining animation play duration
    let T = 0
    // The BeenHereAndLower map (name_pl -> cost)
    const M = new Map()
    // The BeenHereAndLower map but with segments (name_pl1 + name_pl2 => cost)
    const D = new Map()
    // The fromToSegmentActivated Set (name_pl -> name_pl, in both direction)
    // Segment with substations of the same pl preserved
    const S = new Set()

    clearActiveEls()
    const decodedSub = decodeSubstation(startingNode)

    const addReachableNodes = (origin, cost) => {

        const { name, pl } = origin
        const { adjacents } = subway.stations.dict[origin.name].substations[pl]

        // For an adjacent, check if has been here and the cost is actually lower
        const spentCost = costAllowed.clickStations - cost
        const encodedSub = encodeSubstation(name, pl)
        const beenHereAndLower = M.has(encodedSub) && M.get(encodedSub) < spentCost
        if (!beenHereAndLower) M.set(encodedSub, spentCost)

        // Wait a minute - did I just implemented Dijkstra?

        for (const adj of adjacents) {

            if (!(adj.t > 0)) {
                throw new Error(`Cost of ${adj.name} (${adj.t}) should be above zero. Process halted to prevent infinite recursive calls.`)
            }
            if (beenHereAndLower && S.has(encodeSegmentBySubstations(origin, adj))) {
                // Condition #2 to stop recursive call
            }
            else if (adj.t < cost) {
                // This adjacent point is reachable, continue search
                S.add(encodeSegmentBySubstations(origin, adj))
                const segmToPaint = encodeSegment({
                    lineId: pl,
                    from: name,
                    to: adj.name
                })
                if (clicked) {
                    const spentCost = costAllowed.clickStations - (cost - adj.t)
                    T = Math.max(T, spentCost * playbackSpeed)
                    // No need to draw if the segment is a transfer segment
                    if (pl === adj.pl) {
                        const throughHereAndLower = D.has(segmToPaint) && D.get(segmToPaint) < spentCost
                        if (!throughHereAndLower && spentCost < costAllowed.clickLines) D.set(segmToPaint, spentCost)
                    }
                } else {
                    activeStations.add(adj.name)
                    if (pl === adj.pl) {
                        activeLineSegments.add(segmToPaint)
                    }
                }
                addReachableNodes(adj, cost - adj.t)
            }
        }
    }

    activeStations.add(decodedSub.name)
    addReachableNodes(decodedSub, clicked ? costAllowed.clickStations : costAllowed.hover)
    if (clicked) triggerAnimation(M, D, T)

    // Release the spaces
    M.clear()
    S.clear()
    D.clear()
}

const triggerAnimation = (M, D, T) => {

    const { playbackSpeed, costAllowed, activeStations, activeLineSegments, activeStationsListed } = getState()

    // Add timeouts for entering active stations (faster pace)
    M.forEach((timeout, key) => {
        setSavedTimeout(() => {
            activeStations.add(decodeSubstation(key).name)
        }, timeout * (playbackSpeed < 3 ? playbackSpeed / 3 : 1))
    })
    // Add timeouts for entering active line segments (slower pace)
    D.forEach((timeout, key) => {
        setSavedTimeout(() => {
            activeLineSegments.add(key)
        }, timeout * playbackSpeed)
    })
    // Add timeouts for entering active stations in the config panel
    M.forEach((timeout, key) => {
        setSavedTimeout(() => {
            activeStationsListed.add(`${decodeSubstation(key).name},${decodeSubstation(key).pl},${timeout}`)
        }, timeout * playbackSpeed)
    })
    // Render every 50 milliseconds (fps is 1000/~)
    for (let i = 0; i < T; i += 50) {
        setSavedTimeout(() => {
            render()
        }, i)
    }
    // Update the clock figures
    for (let i = 0; i < costAllowed.clickLines; i += 60) {
        setSavedTimeout(() => {
            d3.select('.time-elapsed').text(i / 60 + 1)
        }, i * playbackSpeed)
    }

}