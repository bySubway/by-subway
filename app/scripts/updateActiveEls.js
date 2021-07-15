import { decodeSubstation, encodeSegment, encodeSegmentBySubstations, encodeSubstation } from './encoders'
import { render } from './render'
import { setSavedTimeout } from './utils'

export const clearActiveEls = () => {

    window.state.activeStations.clear()
    window.state.activeLineSegments.clear()

}

export const updateActiveEls = (sub, sync) => {

    const state = window.state
    const { stations } = state.subway

    clearActiveEls()

    // The recorded maximum timeout, for determining animation play duration
    let T = 0
    // The BeenHereAndLower map (name_pl -> cost)
    const M = new Map()
    // The BeenHereAndLower map but with segments (name_pl1 + name_pl2 => cost)
    const D = new Map()
    // The fromToSegmentActivated Set (name_pl -> name_pl, in both direction)
    // Segment with substations of the same pl preserved
    const S = new Set()

    const decodedSub = decodeSubstation(sub)

    const addReachableNodes = (origin, cost) => {
        
        const { name, pl } = origin
        const { adjacents } = stations.dict[origin.name].substations[pl]

        // For an adjacent, check if has been here and the cost is actually lower
        const spentCost = state.costAllowedForSearch - cost
        const encodedSub = encodeSubstation(name, pl)

        const beenHereAndLower = M.has(encodedSub) && M.get(encodedSub) < spentCost
        // Dijkstra!
        if (!beenHereAndLower) M.set(encodedSub, spentCost)

        for (const adj of adjacents) {

            if (!(adj.t > 0)) {
                throw new Error(`Cost of ${adj.name} (${adj.t}) should be above zero. Process halted to prevent infinite recursive calls.`)
            }

            if (beenHereAndLower && S.has(encodeSegmentBySubstations(origin, adj))) {
                // Condition #2 to stop recursive call
            }

            else if (adj.t < cost) {
                // This adjacent point is reachable!
                S.add(encodeSegmentBySubstations(origin, adj))

                const segmToPaint = encodeSegment({
                    lineId: pl,
                    from: name,
                    to: adj.name
                })

                if (sync) {

                    const spentCost = state.costAllowedForSearch - (cost - adj.t)
                    T = Math.max(T, spentCost * 3)
                    // No need to draw if the segment is a transfer segment
                    if (pl === adj.pl) {
                        const throughHereAndLower = D.has(segmToPaint) && D.get(segmToPaint) < spentCost
                        if (!throughHereAndLower) D.set(segmToPaint, spentCost)
                    }

                } else {

                    state.activeStations.add(adj.name)
                    if (pl === adj.pl) {
                        state.activeLineSegments.add(segmToPaint)
                    }

                }

                addReachableNodes(adj, cost - adj.t)
            }
        }
    }

    state.activeStations.add(decodedSub.name)
    addReachableNodes(decodedSub, sync ? state.costAllowedForSearch : state.costAllowedForHover)

    if (sync) {

        // Add timeouts for entering active stations
        M.forEach((timeout, key) => {
            setSavedTimeout(() => {
                state.activeStations.add(decodeSubstation(key).name)
            }, timeout * 1)
        })

        // Add timeouts for entering active line segments
        D.forEach((timeout, key) => {
            setSavedTimeout(() => {
                state.activeLineSegments.add(key)
            }, timeout * 3)
        })

        // Render every 50 milliseconds (fps is 1000/~)
        for (let i = 0; i < T; i += 50) {
            setSavedTimeout(() => {
                render()
            }, i)
        }
        
    }

    M.clear()
    S.clear()
    D.clear()
}





