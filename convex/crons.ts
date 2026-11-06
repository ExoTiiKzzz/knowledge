import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Rooms whose players all closed their tab: nobody is left to send a heartbeat.
crons.interval('sweep rooms', { minutes: 1 }, internal.rooms.sweep, {})

export default crons
