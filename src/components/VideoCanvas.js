import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'
import { scaleCanvas } from '../utils/utils'

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

    const drawVideo = (ctx) => {
        const rect = canvasRef.current.getBoundingClientRect()
        ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight, 0, 0, rect.width, rect.height)
        ctx.fill()
    }

    useEffect(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        video.addEventListener('loadedmetadata', () => {
            scaleCanvas(canvas, video)

            drawVideo(ctx)

            canvas.addEventListener('click', e => {
                drawVideo(ctx)
                
                ctx.fillStyle = '#fff'
                ctx.beginPath()
                ctx.arc(e.offsetX, e.offsetY, 5, 0, 2 * Math.PI)
                ctx.fill()
            })
        })

        video.addEventListener('canplaythrough', () => {
            drawVideo(ctx)
        })

        window.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowRight': {
                    video.currentTime += 1 / 10
                    break
                }

                case 'ArrowLeft': {
                    video.currentTime -= 1 / 10
                    break
                }
            }
        })
    }, [])

    return (
        <Wrapper>
            <Video ref={videoRef} muted>
                <source src="video1.mp4" type="video/mp4" />
            </Video>
            <Canvas ref={canvasRef}></Canvas>
        </Wrapper>
    )
}

export default VideoCanvas
