import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'

/**
 * One controller per route: each is a single-action controller exposing `handle`.
 */
const CreateRoom = () => import('#controllers/rooms/create_room_controller')
const ShowRoom = () => import('#controllers/rooms/show_room_controller')
const JoinRoom = () => import('#controllers/rooms/join_room_controller')
const LeaveRoom = () => import('#controllers/rooms/leave_room_controller')
const UpdateSettings = () => import('#controllers/rooms/update_settings_controller')
const StartGame = () => import('#controllers/rooms/start_game_controller')
const SubmitAnswer = () => import('#controllers/rooms/submit_answer_controller')

/**
 * Solo is a page that mounts the client application and never speaks to the
 * server again: it keeps working offline (ADR-0001).
 */
router.on('/').renderInertia('home', {})
router.on('/solo').renderInertia('solo', {})

/**
 * The room code lives in the URL, so sharing the link is enough to invite. The
 * path stays French because it is user-facing; the page component is `room`.
 */
router.on('/salon/:code').renderInertia('room', {})

router
  .group(() => {
    router.post('/', [CreateRoom])
    router.get('/:code', [ShowRoom])
    router.post('/:code/join', [JoinRoom])
    router.post('/:code/leave', [LeaveRoom])
    router.post('/:code/settings', [UpdateSettings])
    router.post('/:code/start', [StartGame])
    router.post('/:code/answer', [SubmitAnswer])
  })
  .prefix('/api/rooms')

/**
 * Room broadcast channel: Transmit's server-sent event stream.
 *
 * The anti-buffering headers live in a server-stack middleware, not here: they
 * must be set before the controller starts writing to the stream.
 */
transmit.registerRoutes()
