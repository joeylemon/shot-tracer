import React, { useRef, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import {
    scaleCanvas,
    getTransformedPoint,
    enforceBounds,
    lerp,
    getAngle,
    moveFromAngle,
    drawTrajectoryLine
} from './utils'

// How many pixels moved before registering a drag?
const DRAG_THRESHOLD = 5

// How many pixels of buffer to add to beginning of the trajectory line?
const INITIAL_POINT_BUFFER = 20

const Wrapper = styled.div`
    text-align: center;
`

const Video = styled.video`
    display: none;
`

const Canvas = styled.canvas`
    display: inline-block;
    width: 80%;
    height: 100px;
    border: 1px solid red;
`

const VideoCanvas = () => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const pointsRef = useRef([{ x: 224.45124761333608, y: 421.25342652759196, offsetX: 371, offsetY: 439, time: 1.399999 },
        { x: 329.1308379025729, y: 342.6893265392042, offsetX: 852, offsetY: 78, time: 1.599999 },
        { x: 385.7144002210793, y: 301.5574293153669, offsetX: 559, offsetY: 319, time: 1.699999 },
        { x: 433.59279910596933, y: 268.0425500959439, offsetX: 521, offsetY: 338, time: 1.799999 },
        { x: 475.1599545014875, y: 240.40365619421195, offsetX: 573, offsetY: 305, time: 1.899999 },
        { x: 511.2863827509955, y: 216.89971492344773, offsetX: 511, offsetY: 327, time: 1.999999 },
        { x: 543.2778583695356, y: 198.18361354117252, offsetX: 658, offsetY: 241, time: 2.099999 },
        { x: 571.5696395287888, y: 181.86143210314185, offsetX: 529, offsetY: 340, time: 2.199999 },
        { x: 597.2498716579571, y: 167.71554152351524, offsetX: 647, offsetY: 275, time: 2.299999 },
        { x: 619.8832965853596, y: 156.39882905981398, offsetX: 751, offsetY: 223, time: 2.399999 },
        { x: 640.3404306543581, y: 147.25840745451677, offsetX: 845, offsetY: 181, time: 2.499999 },
        { x: 659.7094192941546, y: 139.64138945010245, offsetX: 373, offsetY: 422, time: 2.599999 },
        { x: 676.4668589038661, y: 133.54777504657102, offsetX: 450, offsetY: 394, time: 2.699999 },
        { x: 692.1361530843756, y: 129.19519332976282, offsetX: 522, offsetY: 374, time: 2.799999 },
        { x: 706.717301835683, y: 124.84261161295464, offsetX: 589, offsetY: 354, time: 2.899999 },
        { x: 720.2103051577883, y: 122.44869166871014, offsetX: 651, offsetY: 343, time: 2.999999 },
        { x: 733.0504212223725, y: 120.70765898198687, offsetX: 710, offsetY: 335, time: 3.099999 },
        { x: 744.7236355542018, y: 120.30768091662078, offsetX: 701, offsetY: 319, time: 3.199999 },
        { x: 755.5340773457361, y: 120.79906463441779, offsetX: 789, offsetY: 323, time: 3.299999 },
        { x: 765.3617517016764, y: 121.16760242276555, offsetX: 869, offsetY: 326, time: 3.399999 },
        { x: 775.1894260576169, y: 123.25598322340288, offsetX: 949, offsetY: 343, time: 3.499999 },
        { x: 783.9114870485139, y: 124.60728844734467, offsetX: 1020, offsetY: 354, time: 3.599999 },
        { x: 792.3878561805125, y: 127.8012826130253, offsetX: 1089, offsetY: 380, time: 3.699999 },
        { x: 800.1271497358155, y: 131.36381456705368, offsetX: 1152, offsetY: 409, time: 3.799999 },
        { x: 807.3750595733214, y: 135.9091139566761, offsetX: 477, offsetY: 298, time: 3.899999 },
        { x: 814.1315856930305, y: 139.9630296285015, offsetX: 532, offsetY: 331, time: 3.999999 },
        { x: 821.0109577421887, y: 144.75402087702238, offsetX: 588, offsetY: 370, time: 4.099998 },
        { x: 826.7847164263037, y: 150.15924177278958, offsetX: 635, offsetY: 414, time: 4.199998 },
        { x: 832.8041669693172, y: 156.30154574317277, offsetX: 494, offsetY: 174, time: 4.299998 },
        { x: 838.3322337945335, y: 162.4438422156355, offsetX: 539, offsetY: 224, time: 4.399998 },
        { x: 843.2460709725037, y: 168.46329275864895, offsetX: 579, offsetY: 273, time: 4.499998 },
        { x: 848.0370622210247, y: 175.5883566667057, offsetX: 618, offsetY: 331, time: 4.599997 },
        { x: 852.7052075400964, y: 182.95911243366095, offsetX: 656, offsetY: 391, time: 4.699997 },
        { x: 857.1276610002694, y: 189.8384844828192, offsetX: 479, offsetY: 194, time: 4.799996 },
        { x: 860.813038883747, y: 197.45493210867298, offsetX: 509, offsetY: 256, time: 4.899996 },
        { x: 864.9898004850218, y: 205.07137973452674, offsetX: 543, offsetY: 318, time: 4.999995 },
        { x: 868.6751783684994, y: 212.93351921927902, offsetX: 573, offsetY: 382, time: 5.099995 },
        { x: 875.9230882060053, y: 236.27424581463734, offsetX: 632, offsetY: 572, time: 5.199994 }])
    const isVideoPlaying = useRef(false)

    const draw = useCallback((ctx, continuous) => {
        const rect = canvasRef.current.getBoundingClientRect()
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight, 0, 0, rect.width, rect.height)

        // If the video isn't playing, display the user's selected points
        if (!isVideoPlaying.current) {
            for (const pt of pointsRef.current) {
                ctx.fillStyle = 'rgba(150,0,0,0.8)'
                ctx.beginPath()
                ctx.arc(pt.x, pt.y, 5 / ctx.getTransform().a, 0, 2 * Math.PI)
                ctx.fill()
            }

            return
        }

        const nextFrameIndex = pointsRef.current.findIndex(e => e.time > videoRef.current.currentTime)
        const pts = pointsRef.current.slice(0, nextFrameIndex > -1 ? nextFrameIndex : undefined)

        if (pts.length > 1) {
            if (nextFrameIndex !== -1) {
                // Add the last point to be the linearly interpolated position between the current frame and the next frame
                pts.push(lerp(
                    pts.at(-1),
                    pointsRef.current[nextFrameIndex],
                    (videoRef.current.currentTime - pts.at(-1).time) / (pointsRef.current[nextFrameIndex].time - pts.at(-1).time)))
            }

            drawTrajectoryLine(ctx, pts)
        }

        if (continuous) window.requestAnimationFrame(() => draw(ctx, true))
    }, [])

    /**
     * Initialize the canvas with scaling and event listeners
     */
    const initializeCanvas = useCallback(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        scaleCanvas(canvas, video)

        canvas.addEventListener('click', e => {
            if (canvas.justDragged) {
                canvas.justDragged = false
                return
            }
            const pt = getTransformedPoint(ctx, e.offsetX, e.offsetY)
            pointsRef.current = [...pointsRef.current, { x: pt.x, y: pt.y, time: video.currentTime }]
            draw(ctx)
        })

        canvas.addEventListener('mousewheel', e => {
            const zoom = e.deltaY < 0 ? 1.1 : 0.9
            const pt = getTransformedPoint(ctx, e.offsetX, e.offsetY)
            ctx.translate(pt.x, pt.y)
            ctx.scale(zoom, zoom)
            ctx.translate(-pt.x, -pt.y)

            enforceBounds(canvasRef.current, ctx)
            draw(ctx)
        })

        canvas.addEventListener('mousedown', e => {
            canvas.dragStart = getTransformedPoint(ctx, e.offsetX, e.offsetY)
            canvas.dragStartUntransformed = { x: e.offsetX, y: e.offsetY }
        })

        canvas.addEventListener('mousemove', e => {
            if (canvas.dragStart) {
                const pt = getTransformedPoint(ctx, e.offsetX, e.offsetY)
                ctx.translate(pt.x - canvas.dragStart.x, pt.y - canvas.dragStart.y)
                enforceBounds(canvasRef.current, ctx)
                draw(ctx)
            }
        })

        canvas.addEventListener('mouseup', e => {
            const pt = { x: e.offsetX, y: e.offsetY }

            if (Math.abs(pt.x - canvas.dragStartUntransformed.x) > DRAG_THRESHOLD ||
                Math.abs(pt.y - canvas.dragStartUntransformed.y) > DRAG_THRESHOLD) {
                canvas.justDragged = true
            }

            if (canvas.dragStart) {
                canvas.dragStart = null
                canvas.dragStartUntransformed = null
            }
        })
    }, [draw])

    const handlePlayVideo = () => {
        // Remove the previously-added first frame if it exists
        pointsRef.current = pointsRef.current.filter(e => !e.temp)

        // Ensure the points are ordered by frame to prevent user error
        pointsRef.current.sort((a, b) => a.time < b.time ? -1 : 1)

        // Add an initial point at time 0 a small amount behind the first point to add smoother lerping
        const newPoint = moveFromAngle(pointsRef.current[0], getAngle(pointsRef.current[0], pointsRef.current[1]), INITIAL_POINT_BUFFER)
        pointsRef.current = [{ ...newPoint, time: 0, temp: true }, ...pointsRef.current]

        videoRef.current.currentTime = 0
        videoRef.current.play()
        isVideoPlaying.current = true

        window.requestAnimationFrame(() => draw(canvasRef.current.getContext('2d'), true))
    }

    useEffect(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        video.addEventListener('loadedmetadata', initializeCanvas)

        // Ensure the first frame of the video is rendered to the canvas when ready
        video.addEventListener('loadeddata', function loaded () {
            video.play()
            video.pause()
            setTimeout(() => draw(ctx), 500)
            video.removeEventListener('loadeddata', loaded, false)
        })

        video.addEventListener('ended', () => {
            isVideoPlaying.current = false
        })

        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight') {
                video.currentTime += 1 / 10
                return draw(ctx)
            }

            if (e.key === 'ArrowLeft') {
                video.currentTime -= 1 / 10
                return draw(ctx)
            }
        })
    }, [draw, initializeCanvas])

    return (
        <Wrapper>
            <Video ref={videoRef} muted>
                <source src="video3.mp4" type="video/mp4" />
            </Video>
            <Canvas ref={canvasRef}></Canvas>
            <button onClick={handlePlayVideo}>Play</button>
        </Wrapper>
    )
}

export default VideoCanvas
