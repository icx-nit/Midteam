import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'


const app = new Hono()

app.get('/', (c) => {
  const stmt = db.prepare('SELECT * FROM Appointment')
  const data = stmt.all()

  return c.json({
    message: 'List of appointments',
    data
  })
})


app.get('/:id', (c) => {
  const id = c.req.param('id')
  const stmt = db.prepare('SELECT * FROM Appointment WHERE "Appointment ID" = ?')
  const data = stmt.get(id)

  if (!data) {
    return c.json({ message: 'Not Found' }, 404)
  }

  return c.json({ data })
})


const updateAppointmentSchema = z.object({
  Date: z.string().optional(),
  Time: z.string().optional(),
  Status: z.string().optional(),
  Notes: z.string().optional()
})

app.put(
  '/:id',
  zValidator('json', updateAppointmentSchema),
  async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()

    const exists = db
      .prepare('SELECT * FROM Appointment WHERE "Appointment ID" = ?')
      .get(id)

    if (!exists) {
      return c.json({ message: 'Appointment not found' }, 404)
    }

    db.prepare(`
      UPDATE Appointment SET
        Date   = COALESCE(@Date, Date),
        Time   = COALESCE(@Time, Time),
        Status = COALESCE(@Status, Status),
        Notes  = COALESCE(@Notes, Notes)
      WHERE "Appointment ID" = @id
    `).run({ ...body, id })

    const updated = db
      .prepare('SELECT * FROM Appointment WHERE "Appointment ID" = ?')
      .get(id)

    return c.json({
      message: 'Appointment updated',
      data: updated
    })
  }
)



app.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))

  const result = db
    .prepare('DELETE FROM Appointment WHERE "Appointment ID" = ?')
    .run(id)

  if (result.changes === 0) {
    return c.json({ message: 'Appointment not found' }, 404)
  }

  return c.json({
    message: 'Appointment deleted',
    id
  })
})

export default app