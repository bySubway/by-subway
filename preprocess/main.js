const fs = require('fs')
const { readFile } = require('fs/promises')
const { Parser } = require('xml2js')
const get = require('lodash/get')
const fetch = require('node-fetch')
const stringify = require('json-stringify-pretty-compact')

const generateEmptyIterables = () => ({
    list: [],
    dict: {}
})

const sleep = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

Promise.all([
    readFile('./preprocess/raw/beijing.xml', 'utf-8'),
    readFile('./preprocess/raw/transit.xml', 'utf-8'),
    readFile('./preprocess/raw/metrostations-beijing.json', 'utf-8')
]).then(resps => {

    const xmls = resps.slice(0, 2)
    const stationInfos = JSON.parse(resps[2])

    Promise.all(xmls.map(xml => {

        const parser = new Parser()
        return parser.parseStringPromise(xml)

    })).then(async jsons => {

        const _lines = jsons[0]
        const _interchanges = jsons[1]

        const lines = generateEmptyIterables()
        const stations = generateEmptyIterables()

        // Step I
        // Iterate all lines to generate data for line and stations

        _lines.sw.l.forEach(rawLine => {
            const lineId = Number(rawLine.$.lnub)
            const rawStations = rawLine.p
            const stationsForThisLine = rawStations.map(rawStation => {

                const isAux = rawStation.$.lb.length === 0
                const x = Number(rawStation.$.x)
                const y = Number(rawStation.$.y)
                const stationName = isAux ? `aux_${x}_${y}` : rawStation.$.lb
                const parentLines = get(stations.dict, `${stationName}.parentLines`, [])
                parentLines.push(lineId)

                const substations = parentLines.reduce((accu, currPl) => ({
                    ...accu,
                    [currPl]: {
                        adjacents: []
                    }
                }), {})

                if (!stations.list.includes(stationName)) stations.list.push(stationName)

                const formattedStation = {
                    name: stationName,
                    x,
                    y,
                    parentLines,
                    isAux,
                    substations
                }
                stations.dict[stationName] = formattedStation

                return stationName

            })

            const formattedLine = {
                id: lineId,
                name: rawLine.$.lb,
                color: rawLine.$.lc.replace('0x', '#'),
                loop: rawLine.$.loop === 'true',
                stations: stationsForThisLine
            }

            lines.list.push(lineId)
            lines.dict[lineId] = formattedLine

        })

        // Step II
        // Iterate all exs to fill additional data for interchange stations

        _interchanges.exs.ex.forEach(rawEx => {

            const stationName = rawEx.$.s
            const stationObj = stations.dict[stationName]
            const [fromLine, toLine, t, d] = ['fl', 'tl', 't', 'd'].map(
                key => Number(rawEx.$[key])
            )

            const { parentLines } = stationObj

            stations.dict[stationName] = {
                ...stationObj,
                parentLines: [
                    ...new Set([
                        ...parentLines,
                        fromLine,
                        toLine
                    ])
                ]
            }

            // Calculate transfer time based on t and d
            // Assume walk speed 1.5m/s
            // Assume average transfer waiting time 300s

            stationObj.substations[fromLine].adjacents.push({
                name: stationName,
                pl: toLine,
                t: ((d / 1.5) || t || 200) + 180
            })

        })

        // Step III
        // Fill additional stations infos, including translation, lat/lon, etc.

        stationInfos.forEach(info => {
            try {
                const station = stations.dict[info.zh]
                station.translation = info.en
                station.grade = info.grade
            } catch (e) {
                console.info(`Cannot find ${info.zh} in the station dict, skipping...`)
            }
        })

        // Step IV
        // Fetch route information (timetable) for each line

        await appendAdjacentNodes(lines, stations)
        fs.writeFileSync(
            './app/data/subway.json',
            stringify({ lines, stations }, { maxLength: 120 })
        )


    })
}).catch(e => {
    console.error("Failed in preprocessing data: ", e)
})

const fetchByStartEnd = async (start, end) => {
    console.log(`Querying route from ${start} to ${end}...`)
    await sleep(200)
    return await fetch(encodeURI(`https://map.bjsubway.com/searchstartend?start=${start}&end=${end}`))
        .then(res => res.json()).then(json => {
            return JSON.parse(json.fangan)[0].p[0]
        })
        .catch(e => console.error("Failed in fetching routes: ", e))
}

const appendAdjacentNodes = async (lines, stations) => {

    const routes = {}
    const manualOperateLines = {
        0: [
            ['古城', '四惠东']
        ],
        1: [
            ['西直门', '东直门'],
            ['东直门', '前门'],
            ['前门', '西直门']
        ],
        7: [
            ['巴沟', '丰台站'],
            ['丰台站', '国贸'],
            ['国贸', '巴沟']
        ],
        8: [
            ['西直门', '霍营'],
            ['霍营', '东直门']
        ],
        11: [
            ['四惠', '花庄']
        ],
        15: [
            ['东直门', '3号航站楼'],
            ['3号航站楼', '东直门']
        ],
        16: [
            ['北京西站', '花庄']
        ],
        24: [
            ['定海园', '屈庄']
        ]
    }

    for (lineId of lines.list) {
        if (lineId in manualOperateLines) {
            routes[lineId] = []
            for (let [start, end] of manualOperateLines[lineId]) {
                routes[lineId].push(await fetchByStartEnd(start, end))
            }
            routes[lineId] = routes[lineId].flat()
        }
        else {
            const stationsForThisLine = lines.dict[lineId].stations
            const l = stationsForThisLine.length
            routes[lineId] = await fetchByStartEnd(
                stationsForThisLine[0],
                stationsForThisLine[l - 1]
            )
        }
    }

    for (lineId in routes) {
        
        for (let i = 0; i < routes[lineId].length - 1; i++) {
            const currentStop = routes[lineId][i]
            const currentStation = currentStop[1]
            const nextStop = routes[lineId][i + 1]
            const nextStation = nextStop[1]
            let t = nextStop[2] - currentStop[2]

            // Patch data for a specific corrupted case
            if (currentStation === '角门西' && nextStation === '公益西桥') t = 120
            if (currentStation !== nextStation) {
                stations.dict[currentStation].substations[lineId].adjacents.push({
                    name: nextStation,
                    pl: Number(lineId),
                    t
                })
                stations.dict[nextStation].substations[lineId].adjacents.push({
                    name: currentStation,
                    pl: Number(lineId),
                    t
                })
            }
        }

    }
}