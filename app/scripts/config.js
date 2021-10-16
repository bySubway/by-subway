export const AIRPORT_LINE_ID = 15
export const HOVER_RADIUS = 30
export const SVG_CONFIG = {
    viewbox: [-100, 0, 2000, 1400]
}

const store = {
    subway: {},
    centerStation: '',
    activeStations: new Set(),
    activeStationsListed: new Set(),
    activeLineSegments: new Set(),
    costAllowed: {
        hover: 30 * 60,
        clickLines: 30 * 60,
        clickStations: 80 * 60
    },
    palette: {
        background: ['#222', '#fff'],
        backgroundWhileAnimating: ['#111', '#eee'],
        dimColor: '#666'
    },
    darkMode: true,
    showVoronoi: false,
    showStationNameOnMap: 1,
    animating: false,
    useAuxStations: true,
    splineTension: 0.3,
    playbackSpeed: 3,
    els: {},
    triggers: []
}

export const getState = () => store
export const getSubway = () => store.subway