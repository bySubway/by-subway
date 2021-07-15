import { getStationsFromSegment } from './utils'

export const DEFAULT_TEXT_OFFSET = {
    anchor: 'start',
    x: 6,
    y: 6
}

export const EN_TRANSLATE = 6

export const OFFSET_PRESETS = {
    center: {
        anchor: 'middle', x: 0, y: 0
    },
    top: {
        anchor: 'middle', x: 0, y: -13
    },
    bottom: {
        anchor: 'middle', x: 0, y: 13
    },
    left: {
        anchor: 'end', x: -9, y: 0
    },
    right: {
        x: 9, y: 0
    },
    bottomLeft: {
        anchor: 'end', x: -4, y: 12
    },
    bottomRight: {
        x: 6, y: 13
    },
    topLeft: {
        anchor: 'end', x: -7, y: -9
    },
    topRight: {
        x: 7, y: -7
    }
}

const {
    top, bottom, left, right,
    bottomLeft, topRight, bottomRight, topLeft
} = OFFSET_PRESETS

const upNDown = (st, i) => i % 2 === 0 ? bottom : top
const wobble = (st, i) => i % 2 === 0 ? left : right

const segmentDefs = [
    {
        segment: {
            lineId: 24,
            from: '亦庄同仁',
            to: '老观里'
        },
        offset: wobble
    },
    {
        segment: {
            lineId: 13,
            from: '小红门',
            to: '万源街'
        },
        offset: topRight
    },
    {
        segment: {
            lineId: 13,
            from: '同济南路',
            to: '亦庄火车站'
        },
        offset: bottomRight
    },
    {
        segment: {
            lineId: 7,
            from: '车道沟',
            to: '火器营'
        },
        offset: left
    },
    {
        segment: {
            lineId: 7,
            from: '苏州街',
            to: '芍药居'
        },
        offset: bottom
    },
    {
        segment: {
            lineId: 7,
            from: '纪家庙',
            to: '成寿寺'
        },
        offset: bottom
    },
    {
        segment: {
            lineId: 4,
            from: '金安桥',
            to: '潞城'
        },
        offset: bottom
    },
    {
        segment: {
            lineId: 4,
            from: '廖公庄',
            to: '北海北'
        },
        offset: top
    },
    {
        segment: {
            lineId: 4,
            from: '十里堡',
            to: '潞城'
        },
        offset: upNDown
    },
    {
        segment: {
            lineId: 16,
            from: '湾子',
            to: '大郊亭'
        },
        offset: bottom
    },
    {
        segment: {
            lineId: 16,
            from: '百子湾',
            to: '欢乐谷景区'
        },
        offset: {
            x: 7,
            y: -7
        }
    },
    {
        segment: {
            lineId: 16,
            from: '双合',
            to: '高楼金'
        },
        offset: upNDown
    },
    {
        segment: {
            lineId: 0,
            from: '苹果园',
            to: '四惠东'
        },
        offset: bottom
    },
    {
        segment: {
            lineId: 10,
            from: '清华东路西口',
            to: '望京东'
        },
        offset: {
            x: -2,
            y: 13
        }
    },
    {
        segment: {
            lineId: 6,
            from: '丰台东大街',
            to: '丰台科技园'
        },
        offset: left
    },
    {
        segment: {
            lineId: 19,
            from: '饶乐府',
            to: '阎村东'
        },
        offset: upNDown
    },
    {
        segment: {
            lineId: 9,
            from: '郭庄子',
            to: '张郭庄'
        },
        offset: upNDown
    },
    {
        segment: {
            lineId: 18,
            from: '北安河',
            to: '永丰'
        },
        offset: upNDown
    },
    {
        segment: {
            lineId: 10,
            from: '南法信',
            to: '俸伯'
        },
        offset: top
    },
    {
        segment: {
            lineId: 11,
            from: '四惠东',
            to: '八里桥'
        },
        offset: upNDown
    },
    {
        segment: {
            lineId: 11,
            from: '临河里',
            to: '通州北苑'
        },
        offset: bottomLeft
    },
    {
        segment: {
            lineId: 22,
            from: '和义',
            to: '德茂'
        },
        offset: topRight
    },
]


const stationDefs = [

    {
        stations: '积水潭，安定门，和平门，景泰，前门，动物园，苏庄，良乡大学城西，大井，桥户营，四道桥，八宝山',
        offset: top
    },
    {
        stations: '安河桥北，北宫门，陶然桥，方庄，中国美术馆，良乡南关，石厂，小园，茶棚，颐和园西门，昌平西山口，昌平东关，昌平，龙泽，回龙观，育知路',
        offset: bottom
    },
    {
        stations: '西钓鱼台，长椿街，农业展览馆，上地，五道口，莲花桥，丰台站，潘家园，海户屯，永泰庄，香山，生命科学园',
        offset: left
    },
    {
        stations: '苹果园，森林公园南门，善各庄，来广营，东湖渠，亦庄火车站',
        offset: right
    },
    {
        stations: '垡头，西钓鱼台，新街口，北邵洼，通运门，和义，肖村，亦庄文化园，荣京东街',
        offset: bottomLeft
    },
    {
        stations: '杨庄，西黄村',
        offset: topLeft
    },
    {
        stations: '林萃桥，阜通，望京南，燕山，房山城关，植物园，万安，永丰南，十三陵景区，平西府，北苑，通州北关',
        offset: topRight
    }

]

export const getTextOffsetDict = () => {
    let ret = {}
    segmentDefs.forEach(def => {
        const { segment, offset } = def
        const stations = getStationsFromSegment(segment, false)
        stations.forEach((st, i) => {
            if (typeof offset === 'function') ret[st] = offset(st, i)
            else ret[st] = offset
        })
    })
    stationDefs.forEach(def => {
        const { station, stations, offset } = def
        if (stations) {
            stations.split('，').forEach((st, i) => {
                if (typeof offset === 'function') ret[st] = offset(st, i)
                else ret[st] = offset
            })
        }
        else ret[station] = offset
    })
    return ret
}