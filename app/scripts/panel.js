import * as d3 from 'd3'
import { decodeSubstation } from "./encoders"
import { getState } from './config'
import { set } from 'lodash'
import { render, renderLineBaseOn, renderTextOn } from './render'

export const initControls = () => {
    const configurables = [
        {
            statePath: 'playbackSpeed',
            beforeSend: orig => 30 / orig,
            text: 'Playback Speed',
            rangeProps: {
                min: 1,
                max: 90,
                step: 1,
                value: 10
            }
        },
        {
            statePath: 'costAllowed.hover',
            beforeSend: orig => orig * 60,
            text: 'Cost for Hovering',
            rangeProps: {
                min: 10,
                max: 60,
                step: 1,
                value: 30
            }
        },
        {
            statePath: 'costAllowed.clickLines',
            beforeSend: orig => orig * 60,
            text: 'Cost for Clicking',
            rangeProps: {
                min: 10,
                max: 60,
                step: 1,
                value: 30
            }
        },
        {
            statePath: 'splineTension',
            beforeSend: orig => orig,
            afterSend: () => {
                renderLineBaseOn(getState().els.gLineBase)
            },
            text: 'Spline Tension',
            rangeProps: {
                min: 0,
                max: 1,
                step: 0.01,
                value: 0.3
            }
        },
        {
            statePath: 'useAuxStations',
            beforeSend: orig => orig === '1' ? true : false,
            afterSend: () => {
                renderLineBaseOn(getState().els.gLineBase)
            },
            text: 'Use Auxiliary Stations',
            rangeProps: {
                min: 0,
                max: 1,
                step: 1,
                value: 1
            }
        },
        {
            statePath: 'showStationNameOnMap',
            beforeSend: orig => orig,
            afterSend: () => {
                renderTextOn(getState().els.gText)
            },
            text: 'Show Station Names',
            rangeProps: {
                min: 0,
                max: 1,
                step: 0.1,
                value: 1
            }
        },
        {
            statePath: 'darkMode',
            beforeSend: orig => orig === '1' ? true : false,
            afterSend: () => {
                render()
            },
            text: 'Dark Mode',
            rangeProps: {
                min: 0,
                max: 1,
                step: 1,
                value: 1
            }
        }
    ]

    const configItems = d3.select('.config-items')
        .selectAll('div')
        .data(configurables)
        .join('div')
        .attr('class', 'config-item')

    configItems.append('h5').text(c => c.text)
    configItems.append('input')
        .attr('type', 'range')
        .attr('min', c => c.rangeProps.min)
        .attr('max', c => c.rangeProps.max)
        .attr('step', c => c.rangeProps.step)
        .attr('value', c => c.rangeProps.value)
        .on('input', (ev, c) => {
            const newValue = ev.target.value
            const state = getState()
            set(state, c.statePath, c.beforeSend(newValue))
            if (c.afterSend) c.afterSend()
        })

}

export const renderPanel = () => {
    const { animating, centerStation, subway, activeStationsListed, activeLineSegments } = getState()
    const { stations, lines } = subway

    if (centerStation) {
        const { name, pl } = decodeSubstation(centerStation)
        d3.select(".name").text(name)
        d3.select(".name-substation").text(stations.dict[name].parentLines.length > 1 ? `${lines.dict[pl].name}站台` : '')
        d3.select(".name-en").text(stations.dict[name].translation)
        d3.select(".pls")
            .selectAll('div')
            .data(stations.dict[name].parentLines)
            .join('div')
            .attr('class', 'single-pl-box-mini')
            .text(pl => lines.dict[pl].name)
            .style('background', pl => lines.dict[pl].color)
    } else {
        d3.select(".name").text('')
        d3.select(".name-en").text('')
        d3.select(".pls").html('')
        d3.select(".name-substation").text('')
    }

    if (animating) {
        d3.select(".stations-reached .data")
            .selectAll('div')
            .data(activeStationsListed)
            .join('div')
            .attr('class', 's-reached')
            .html(st => {
                const [nameZh, pl, timeout] = st.split(',')
                const line = lines.dict[pl]
                // const nameEn = stations.dict[nameZh].translation
                return `
                    <span class="dot" style="background: ${line.color}"></span>
                    <span>${nameZh} ${(timeout/60).toFixed(0)}min</span>
                `
            })
        // .style('background', st => lines.dict[stations.dict[st].parentLines[0]].color)

        d3.select(".segments-reached .data")
            .selectAll('code')
            .data(activeLineSegments)
            .join('code')
            .text(sg => sg)
    } else {
        d3.select('.time-elapsed').text('30')
        d3.select(".stations-reached .data").html('')
        d3.select(".segments-reached .data").html('')
    }

}