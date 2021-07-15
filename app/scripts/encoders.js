export const encodeSegment = segm => {
    let { lineId, from, to } = segm
    if (from > to) [from, to] = [to, from];
    return JSON.stringify({ lineId, from, to })
}

export const decodeSegment = str => {
    try {
        return JSON.parse(str)
    } catch (e) {
        console.error("Cannot decode segment " + str)
        return {}
    }
}

export const encodeSubstation = (name, pl, st) => {
    if (st === undefined) return JSON.stringify({ name, pl })
    return JSON.stringify({ name, pl, st })
}

export const decodeSubstation = str => {
    try {
        return JSON.parse(str)
    } catch (e) {
        console.error("Cannot decode substation " + str)
        return {}
    }
}

// Determines if the two encoded substations are the same one.
// Note that status is ignored here.
export const areTheSameSubstation = (sub1, sub2) => {
    const [d1, d2] = [sub1, sub2].map(decodeSubstation)
    return d1.name === d2.name && d1.pl === d2.pl
}

export const encodeSegmentBySubstations = (sub1, sub2) => {
    if (JSON.stringify(sub1) > JSON.stringify(sub2)) {
        [sub1, sub2] = [sub2, sub1];
    }
    return JSON.stringify([
        { name: sub1.name, pl: sub1.pl },
        { name: sub2.name, pl: sub2.pl }
    ])
}