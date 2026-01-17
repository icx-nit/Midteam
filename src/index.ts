import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import userRoutes from './users/index.js'
import appointmentRoutes from './Appointment/index.js'


import db from './db/index.js'


const app = new Hono()

app.route('/api/users', userRoutes)
app.route('/api/appointments', appointmentRoutes)
 



serve({ 
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})