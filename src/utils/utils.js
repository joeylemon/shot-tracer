/**
 * Scale the canvas's height to match the video's aspect ratio. Also scale
 * the canvas to match the device's pixel ratio (for retina displays)
 * @param {HTMLCanvasElement} canvas The canvas reference
 * @param {HTMLVideoElement} video The video reference
 */
export function scaleCanvas(canvas, video) {
    const ctx = canvas.getContext('2d')

    let rect = canvas.getBoundingClientRect()
    const newHeight = rect.width * (video.videoHeight / video.videoWidth)
    canvas.style.height = newHeight + "px"
    canvas.height = newHeight

    // Set display size (css pixels).
    rect = canvas.getBoundingClientRect()
    canvas.style.width = rect.width + "px"
    canvas.style.height = rect.height + "px"

    // Set actual size in memory (scaled to account for extra pixel density).
    var scale = window.devicePixelRatio
    canvas.width = Math.floor(rect.width * scale)
    canvas.height = Math.floor(rect.height * scale)

    // Normalize coordinate system to use css pixels.
    ctx.scale(scale, scale)
}