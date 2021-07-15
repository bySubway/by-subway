export const BGCOLOR = '#222'
export const BGCOLOR_ANIMATING = '#111317'
export const DIMCOLOR = "#666"
export const SPLINE_ALPHA = 0.5
export const AIRPORT_LINE_ID = 15
export const HOVER_RADIUS = 30

export const INITIAL_STATE = subway => ({
    subway,
    centerStation: '',
    activeStations: new Set(),
    activeLineSegments: new Set(),
    costAllowedForHover: 30 * 60,
    costAllowedForSearch: 80 * 60,
    animating: false,
    els: {},
    triggers: []
})

export const SVG_CONFIG = {
    viewbox: [-100, 0, 2000, 1400]
}