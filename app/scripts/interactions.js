import { render } from "./render"
import { getState } from "./config"
import { clearActiveEls, updateActiveEls } from "./updateActiveEls"
import { clearAllSavedTimeouts } from "./utils"

export const hoverOnStation = (mouseEnter, sub) => {

    const state = getState()
    if (state.animating) return

    if (mouseEnter) {
        state.centerStation = sub
        updateActiveEls(sub, false)
    } else {
        state.centerStation = ""
        clearActiveEls()
    }

    render()

}

export const clickOnStation = sub => {
    const state = getState()
    if (state.animating) return
    state.animating = true
    updateActiveEls(sub, true)
}

export const onReset = () => {
    const state = getState()
    state.animating = false
    state.centerStation = ''
    clearActiveEls()
    clearAllSavedTimeouts()
    render()
}
