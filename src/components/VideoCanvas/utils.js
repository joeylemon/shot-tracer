const INITIAL_LINE_WIDTH = 15
const MIN_LINE_WIDTH = 3.7
const LINE_WIDTH_REDUCTION_FACTOR = 1.15

/**
 * Scale the canvas's height to match the video's aspect ratio. Also scale
 * the canvas to match the device's pixel ratio (for retina displays)
 * @param {HTMLCanvasElement} canvas The canvas reference
 * @param {HTMLVideoElement} video The video reference
 */
export function scaleCanvas (canvas, video) {
    const ctx = canvas.getContext('2d')

    let rect = canvas.getBoundingClientRect()
    const newHeight = rect.width * (video.videoHeight / video.videoWidth)
    canvas.style.height = newHeight + 'px'
    canvas.height = newHeight

    // Set display size (css pixels).
    rect = canvas.getBoundingClientRect()
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Set actual size in memory (scaled to account for extra pixel density).
    const scale = window.devicePixelRatio
    canvas.width = Math.floor(rect.width * scale)
    canvas.height = Math.floor(rect.height * scale)

    // Normalize coordinate system to use css pixels.
    ctx.scale(scale, scale)
}

/**
 * Draw a trajectory line by following the given points with a smooth curve
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context
 * @param {Array<Object>} pts The array of points that follows the ball
 */
export function drawTrajectoryLine (ctx, pts) {
    const [pts1, pts2] = getParallelPoints(pts)

    const grd = ctx.createLinearGradient(pts1[0].x, pts1[0].y, pts1.at(-1).x, pts1.at(-1).y)
    grd.addColorStop(0, 'rgba(255, 0, 0, 0)')
    grd.addColorStop(0.3, 'rgba(255, 0, 0, 0.5)')
    ctx.fillStyle = grd

    let i
    ctx.beginPath()
    ctx.moveTo(pts1[0].x, pts1[0].y)

    for (i = 1; i < pts1.length - 2; i++) {
        const xc = (pts1[i].x + pts1[i + 1].x) / 2
        const yc = (pts1[i].y + pts1[i + 1].y) / 2
        ctx.quadraticCurveTo(pts1[i].x, pts1[i].y, xc, yc)
    }
    // curve through the last two points
    ctx.quadraticCurveTo(pts1[i].x, pts1[i].y, pts1[i + 1].x, pts1[i + 1].y)
    ctx.lineTo(pts2.at(-1).x, pts2.at(-1).y)

    for (i = pts2.length - 1; i > 1; i--) {
        const xc = (pts2[i].x + pts2[i - 1].x) / 2
        const yc = (pts2[i].y + pts2[i - 1].y) / 2
        ctx.quadraticCurveTo(pts2[i].x, pts2[i].y, xc, yc)
    }

    ctx.quadraticCurveTo(pts2[i].x, pts2[i].y, pts2[i - 1].x, pts2[i - 1].y)
    ctx.lineTo(pts1[0].x, pts1[0].y)

    ctx.fill()
}

/**
 * Get a canvas coordinate pair taking into account the current transformations
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context
 * @param {Number} x The x coordinate of the original position
 * @param {Number} y The y coordinate of the original position
 * @returns {Object} The new coordinates after applying the current transformations
 */
export function getTransformedPoint (ctx, x, y) {
    const transform = ctx.getTransform()
    const inverseZoom = 1 / transform.a

    const transformedX = inverseZoom * x - inverseZoom * transform.e
    const transformedY = inverseZoom * y - inverseZoom * transform.f
    return { x: transformedX, y: transformedY }
}

/**
 * Update the canvas transformation matrix to keep all values within bounds
 * @param {HTMLCanvasElement} canvas The canvas reference
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context
 */
export function enforceBounds (canvas, ctx) {
    const rect = canvas.getBoundingClientRect()
    const transform = ctx.getTransform()

    // Enforce scaling bounds (can't zoom out further than default)
    if (transform.a < 1) transform.a = 1
    if (transform.d < 1) transform.d = 1

    const scaledWidth = rect.width * transform.a
    const scaledHeight = rect.height * transform.d

    // Enforce translation bounds (can't pan left or right past the canvas width)
    if (transform.e > 0) transform.e = 0
    if (transform.e < -(scaledWidth - rect.width)) transform.e = -(scaledWidth - rect.width)
    if (transform.f > 0) transform.f = 0
    if (transform.f < -(scaledHeight - rect.height)) transform.f = -(scaledHeight - rect.height)

    ctx.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
}

/**
 * Get a pair of arrays which represent parallel points with the given list of points perfectly centered between them
 * @param {Array<Object>} points The original list of points
 * @returns {Array<Array>} The pair of parallels point arrays
 */
export function getParallelPoints (points) {
    let width = INITIAL_LINE_WIDTH
    const pts1 = []
    const pts2 = []
    for (let i = 0; i < points.length - 1; i++) {
        pts1.push(moveToAngle(points[i], getAngle(points[i], points[i + 1]) - (Math.PI / 2), width / 2))
        pts2.push(moveToAngle(points[i], getAngle(points[i], points[i + 1]) + (Math.PI / 2), width / 2))
        if (width > MIN_LINE_WIDTH) width /= LINE_WIDTH_REDUCTION_FACTOR
    }
    pts1.push(moveToAngle(points[points.length - 1], getAngle(points[points.length - 2], points[points.length - 1]) - (Math.PI / 2), width / 2))
    pts2.push(moveToAngle(points[points.length - 1], getAngle(points[points.length - 2], points[points.length - 1]) + (Math.PI / 2), width / 2))
    return [pts1, pts2]
}

export function getAngle (from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x)
}

export function moveToAngle (loc, angle, distance) {
    return { ...loc, x: loc.x + Math.cos(angle) * distance, y: loc.y + Math.sin(angle) * distance }
}

export function moveFromAngle (loc, angle, distance) {
    return { ...loc, x: loc.x - Math.cos(angle) * distance, y: loc.y - Math.sin(angle) * distance }
}

/**
 * Linearly interpolate between two locations
 * @param {Object} from Source location
 * @param {Object} to Target location
 * @param {Number} frac How far to interpolate between the two locations [0, 1]
 * @returns {Object} Interpolated location
 */
export function lerp (from, to, frac) {
    const nx = from.x + (to.x - from.x) * frac
    const ny = from.y + (to.y - from.y) * frac
    return { x: nx, y: ny }
}

/**
 * Check if the given video is actively playing
 * @param {HTMLVideoElement} video The video reference
 * @returns True if the video is playing, false if not
 */
export function isVideoPlaying (video) {
    return !!(!video.paused && !video.ended && video.readyState > 2)
}
