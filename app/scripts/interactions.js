import { render } from "./render"
import { clearActiveEls, updateActiveEls } from "./updateActiveEls"
import { clearAllSavedTimeouts } from "./utils"

export const hoverOnStation = (mouseEnter, sub) => {

    const { animating } = window.state
    if (animating) return

    if (mouseEnter) {
        window.state.centerStation = sub
        updateActiveEls(sub, false)
    } else {
        window.state.centerStation = ""
        clearActiveEls()
    }

    render()

}

export const clickOnStation = sub => {
    const { animating } = window.state
    if (animating) return
    window.state.animating = true
    updateActiveEls(sub, true)
}

export const onReset = () => {
    const state = window.state
    state.animating = false
    clearActiveEls()
    clearAllSavedTimeouts()
    render()
}
