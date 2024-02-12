const storyWidgetInit = (className) => {
    const storyWidget = document.querySelector(className)
    if (!storyWidget) {
        console.error('Cannot find the defined container selector for the story widget')
        return
    }
    const storyUgcsContainer = storyWidget.querySelector('.story-list')
    const storyUgcs = storyWidget.querySelectorAll('.story-list__item')
    const storyModalItems = storyWidget.querySelectorAll('.story-modal__item')
    const storyModalWrapper = storyWidget.querySelector('.story-modal__wrapper')
    const storyModalClose = storyWidget.querySelector('.story-modal-close')
    const storyModalImgs = storyWidget.querySelectorAll('.story-modal-img')
    const storyModalList = storyWidget.querySelector('.story-modal-list')
    const storyProgressThumb = storyWidget.querySelector('.story-modal-progressbar__item')
    const storyModalPurchaseButtons = storyWidget.querySelectorAll('.story-modal-purchase')
    const storyModalProductsWrappers = storyWidget.querySelectorAll('.story-modal-products__wrapper')
    const storyUgcsScrollSpeed = 0.8
    const autoplayDuration = 4000
    const swipeCancelTime = 600
    const swipeDirectionSeparatorPoint = 28 /* 0 - 100 percentage */
    let lastDirection = -1
    let autoplayResumeTimeout = null
    let storyAutoplayInterval = null
    let swipeCancelTimeout = null
    let storyAutoplayStarted = 0
    let storyPlayCurrentStarted = 0
    let storyAutoplayStopped = 0
    let storyTimePassed = 0
    let progressAfterPause = 0
    let progressBarPaused = false
    let storyModalItemsLength = storyModalImgs.length
    let storyCurrentSlide = 0
    let storyLastTouchDownX = 0
    let storyLastTouchDownY = 0
    let storySlideIsDown = false
    let storyUgcsMoved = false
    let storyUgcsIsDown = false
    let lastTouchDownMillis = 0
    let storySwipeMin = 40
    let storyUgcsStartX
    let storyUgcsScrollLeft

    const touchDown = (e) => {
        e.preventDefault()
        storyLastTouchDownX = getTouchX(e)
        storyLastTouchDownY = getTouchY(e)
        storySlideIsDown = true
        swipeCancelTimeout = setTimeout(storyStopAutoplay, swipeCancelTime)
        lastTouchDownMillis = Date.now()
    }

    const touchUp = (e) => {
        clearTimeout(swipeCancelTimeout)
        e.preventDefault()
        if (e.target.classList.contains('story-modal-img__item') && storySlideIsDown) {
            let slideDir
            if ((Date.now() - lastTouchDownMillis > swipeCancelTime)) {
                resumeAutoplay()
                return
            }
            if ((Math.abs(storyLastTouchDownX - getTouchX(e)) < storySwipeMin) && (Math.abs(storyLastTouchDownY - getTouchY(e)) < storySwipeMin)) {
                slideDir = 'next'
                if (getTouchX(e, true, true) >= swipeDirectionSeparatorPoint) {
                    slideDir = 'next'
                } else {
                    slideDir = 'prev'
                }
            } else {
                if ((Math.abs(storyLastTouchDownX - getTouchX(e)) < storySwipeMin) || (Date.now() - lastTouchDownMillis > swipeCancelTime)) {
                    return
                }
                slideDir = storyLastTouchDownX < getTouchX(e) ? 'prev' : 'next'
            }
            storySlideSwitch(slideDir)
            storyLaunchAutoplay(autoplayDuration)
            storyAutoplayStarted = Date.now()
            storyPlayCurrentStarted = Date.now()
        }
        storySlideIsDown = false
    }

    const getTouchX = (e, targetRelative, inPercent) => {
        const point = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
        let roomWidth = targetRelative ? e.target.offsetWidth : window.innerWidth
        if (!targetRelative) {
            return inPercent ? point * 100 / roomWidth : point
        } else {
            const rect = e.target.getBoundingClientRect()
            return inPercent ? (point - rect.left) * 100 / roomWidth : point - rect.left
        }
    }

    const getTouchY = (e, targetRelative, inPercent) => {
        const point = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
        let roomHeight = targetRelative ? e.target.offsetHeight : window.innerHeight
        if (!targetRelative) {
            return inPercent ? point * 100 / roomHeight : point
        } else {
            const rect = e.target.getBoundingClientRect()
            return inPercent ? (point - rect.top) * 100 / roomHeight : point - rect.top
        }
    }

    const rebaseItems = () => {
        if (lastDirection === -1) {
            storyModalList.appendChild(storyModalList.firstElementChild)
        } else if (lastDirection === 1) {
            storyModalList.prepend(storyModalList.lastElementChild)
        }
        storyModalList.style.transition = 'none'
        storyModalList.style.transform = 'translate(0)'
        setTimeout(() => { storyModalList.style.transition = 'transform 0.3s ease' })
    }

    const storySlideSwitch = (type, isInstant) => {
        if (isInstant) {
            storyModalList.style.transition = 'none'
        } else {
            storyModalList.style.transition = 'transform .3s ease'
        }
        if (type === 'next') {
            if (storyCurrentSlide === storyModalItemsLength - 1) {
                storyCurrentSlide = 0
            } else {
                storyCurrentSlide++
            }
            if (lastDirection === 1) {
                storyModalList.prepend(storyModalList.lastElementChild)
                lastDirection = -1
            }
            // storyModalList.prepend(storyModalList.lastElementChild)
            storyModalList.style.justifyContent = 'flex-start'
            storyModalList.style.transform = 'translateX(-100%)'
            storyInitProgressbar()
        } else if (type === 'prev') {
            if (storyCurrentSlide > 0) {
                storyCurrentSlide--
            } else {
                storyCurrentSlide = storyModalItemsLength - 1
            }
            if (lastDirection === -1) {
                storyModalList.appendChild(storyModalList.firstElementChild)
                lastDirection = 1
            }
            storyModalList.style.justifyContent = 'flex-end'
            storyModalList.style.transform = 'translateX(100%)'
            storyInitProgressbar()
        } else if (typeof type === 'number') {
            if (storyCurrentSlide < storyModalItemsLength - 1 || storyCurrentSlide >= 0) {
                storyCurrentSlide = type
                if (lastDirection === 1) {
                    lastDirection = -1
                }
                storyModalItems.forEach((item, i) => {
                    if (item.getAttribute('data-key') == type) {
                        foundFirst = true
                        storyModalList.prepend(item)
                        let resortedResult = []
                        let itemsNoCurrent = [...storyModalItems].filter(item => {
                            if (item.getAttribute('data-key') != type) {
                                storyModalList.removeChild(item)
                            }
                            return item.getAttribute('data-key') != type
                        })
                        itemsNoCurrent = itemsNoCurrent
                            .sort((a, b) => {
                                a.getAttribute('data-key') - b.getAttribute('data-key')
                            })
                        let itemsKeyLessCurrent = itemsNoCurrent.filter(itemI => itemI.getAttribute('data-key') < type)
                        let itemsKeyBiggerCurrent = itemsNoCurrent.filter(itemI => itemI.getAttribute('data-key') > type)
                        itemsKeyBiggerCurrent.forEach(itemI => {
                            storyModalList.append(itemI)
                        })
                        itemsKeyLessCurrent.forEach(itemI => {
                            storyModalList.append(itemI)
                        })
                    }
                })
                storyModalList.style.justifyContent = 'flex-start'
                storyModalList.style.transform = 'translateX(0)'
                storyInitProgressbar()
            }
        }
        storyTimePassed = 0
        progressBarPaused = false
        clearTimeout(swipeCancelTimeout)
        clearTimeout(autoplayResumeTimeout)
    }

    const hideProducts = (wrapper, all) => {
        if (!all) {
            wrapper.style.display = ''
        } else {
            storyModalProductsWrappers.forEach(item => item.style.display = '')
        }
    }

    const resumeAutoplay = () => {
        resumeProgressBar()
        autoplayResumeTimeout = setTimeout(() => {
            storySlideSwitch('next')
            storyPlayCurrentStarted = Date.now()
            storyLaunchAutoplay(autoplayDuration)
        }, getStoryTimeRemaining())
        storyPlayCurrentStarted = Date.now()
    }

    const showProducts = (wrapper) => {
        wrapper.style.display = 'flex'
    }

    const storyLaunchAutoplay = (duration) => {
        clearInterval(storyAutoplayInterval)
        storyAutoplayInterval = setInterval(() => {
            storySlideSwitch('next')
            storyPlayCurrentStarted = Date.now()
        }, duration)
    }

    const getStoryTimeRemaining = () => {
        return autoplayDuration - storyTimePassed
    }

    const storyStopAutoplay = () => {
        if (!progressBarPaused) {
            clearInterval(storyAutoplayInterval)
            clearTimeout(autoplayResumeTimeout)
            storyTimePassed += Date.now() - storyPlayCurrentStarted
            pauseProgressBar()
        }
    }

    const storyInitProgressbar = () => {
        storyProgressThumb.setAttribute('style', 'width: 0');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                storyProgressThumb.setAttribute('style', `transition-duration: ${autoplayDuration}ms`);
                storyProgressThumb.style.width = `100%`
            })
        })
    }

    const pauseProgressBar = () => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                progressAfterPause = getComputedStyle(storyProgressThumb, null).getPropertyValue('width')
                storyProgressThumb.setAttribute('style', '')
                storyProgressThumb.style.width = progressAfterPause
            })
        })
        progressBarPaused = true
    }

    const resumeProgressBar = () => {
        if (progressBarPaused) {
            storyProgressThumb.setAttribute('style', '')
            setTimeout(() => {
                storyProgressThumb.setAttribute('style', `width: ${progressAfterPause}`)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        storyProgressThumb.setAttribute('style', `transition-duration: ${getStoryTimeRemaining()}ms`);
                        storyProgressThumb.style.width = '100%'
                    })
                })
            })
            progressBarPaused = false
        }
    }

    const storyCloseModal = () => {
        storyModalWrapper.classList.remove('story-modal__wrapper_active')
        clearInterval(storyAutoplayInterval)
        clearTimeout(autoplayResumeTimeout)
        progressBarPaused = false
        storyAutoplayStarted = 0
        storyPlayCurrentStarted = 0
        storyAutoplayStopped = 0
        storyTimePassed = 0
        hideProducts(null, true)
    }

    const storyUgcsTouchUp = () => {
        storyUgcsIsDown = false
        storyUgcsContainer.classList.remove('active')
    }

    const storyUgcsTouchDown = (e) => {
        const pageX = e.changedTouches ? e.changedTouches[0].pageX : e.pageX
        storyUgcsIsDown = true
        storyUgcsMoved = false
        storyUgcsContainer.classList.add('active')
        storyUgcsStartX = pageX - storyUgcsContainer.offsetLeft
        storyUgcsScrollLeft = storyUgcsContainer.scrollLeft
    }

    const storyUgcsTouchMove = (e) => {
        if (!storyUgcsIsDown) return
        storyUgcsMoved = true
        e.preventDefault()
        const pageX = e.changedTouches ? e.changedTouches[0].pageX : e.pageX
        const x = pageX - storyUgcsContainer.offsetLeft
        const walk = (x - storyUgcsStartX) * storyUgcsScrollSpeed
        storyUgcsContainer.scrollLeft = storyUgcsScrollLeft - walk
    }

    const toggleFullScreen = (flag) => {
        return new Promise((resolve, reject) => {
            const maxFullscreenWidth = 1024
            const maxFullscreenHeight = 900
            if (document.body.requestFullscreen) {
                if (flag) {
                    if (window.innerWidth <= maxFullscreenWidth || (window.innerHeight <= maxFullscreenHeight && window.innerWidth <= maxFullscreenWidth)) {
                        document.body.requestFullscreen().then(() => {
                            resolve()
                        }).catch(() => {
                            resolve()
                        })
                    } else {
                        resolve()
                    }
                } else {
                    document.exitFullscreen().then(() => {
                        resolve()
                    }).catch(() => {
                        resolve()
                    })
                }
            } else {
                resolve()
            }
        })
    }

    storyUgcsContainer.addEventListener('mousedown', storyUgcsTouchDown)
    storyUgcsContainer.addEventListener('touchstart', storyUgcsTouchDown)
    storyUgcsContainer.addEventListener('mouseleave', storyUgcsTouchUp)
    storyUgcsContainer.addEventListener('mouseup', storyUgcsTouchUp)
    storyUgcsContainer.addEventListener('touchend', storyUgcsTouchUp)
    storyUgcsContainer.addEventListener('mousemove', storyUgcsTouchMove)
    storyUgcsContainer.addEventListener('touchmove', storyUgcsTouchMove)

    storyModalList.addEventListener('transitionend', rebaseItems)

    storyModalList.style.transform = 'translateX(0px)'

    storyUgcs.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (storyUgcsMoved) {
                storyUgcsMoved = false
                return
            }
            toggleFullScreen(true).then(() => {
                storySlideSwitch(i, true)
                storyModalWrapper.classList.add('story-modal__wrapper_active')
                storyLaunchAutoplay(autoplayDuration)
                storyAutoplayStarted = Date.now()
                storyPlayCurrentStarted = Date.now()
            })
        })
    })

    storyModalImgs.forEach(item => {
        item.querySelector('.story-modal-img__item').setAttribute('draggable', false)
        item.querySelector('.story-modal-img__item').addEventListener('dragstart', (e) => {
            e.preventDefault()
        })
        item.addEventListener('mousedown', touchDown)
        item.addEventListener('touchstart', touchDown)
        item.addEventListener('mouseup', touchUp)
        item.addEventListener('touchend', touchUp)
        item.addEventListener('mouseleave', () => {
            storySlideIsDown = false
        })
    })

    storyModalPurchaseButtons.forEach((item, i) => {
        item.addEventListener('click', () => {
            storyStopAutoplay()
            showProducts(item.nextSibling.nextSibling)
        })
    })

    storyModalProductsWrappers.forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('story-modal-products__wrapper')) {
                e.stopImmediatePropagation()
                hideProducts(e.target)
                resumeAutoplay()
            }
        })

        const close = item.querySelector('.story-modal-products-close')
        close.addEventListener('click', () => {
            hideProducts(item)
            resumeAutoplay()
        })
    })

    storyModalClose.addEventListener('click', () => {
        storyCloseModal()
        toggleFullScreen(false)
    })

    console.log('Story widget loaded')
}