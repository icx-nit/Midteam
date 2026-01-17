import { Hono } from "hono";
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import { count, info } from "console";


const userRoutes = new Hono()

type User = {
    AppointmentID: number
    Date : string
    Time : string
    Status : string
    Notes : string  
}




userRoutes.get('/:id', (c) => {
  const { id } = c.req.param()
  let sql = 'SELECT * FROM users WHERE id = @id'
  let stmt = db.prepare<{id:string}, User>(sql)
  let user = stmt.get({id:id})

if (!user) {
    return c.json({ message: 'User not found'}, 404)
}
  return c.json({
    message: `User details for ID: ${id}`,
    data : user
  })
})

userRoutes.get('/', async (c) => {
    let sql = 'SELECT * FROM users'
    let stmt = db.prepare(sql)
    let users = await stmt.all()
    
    return c.json({message: 'List of users',data : users})
})
 

const createUserSchema = z.object({ 
    Date: z.string("กรอกวันที่"),
    Time: z.string("กรอกเวลา").optional(),
    Status : z.string("กรอกสถานะ").optional(),
    Notes : z.string("กรอกรายละเอียดเพิ่มเติม").optional()

})





userRoutes.post('/',
    zValidator('json', createUserSchema,(result,c)=>{
        if (!result.success) {
            const error = result.error.issues.map((err) => err.message)
            return c.json({message: 'Validation Failed',
                error : result.error.issues }, 400)
        }
    }),
    async (c) => {
    const body = await c.req.json<User>()
    let sql = `INSERT INTO users 
        (  Appointment_ID,Date,Time,Status,Notes) 
        VALUES(@Appointment_ID,@Date,@Time,@Status,@Notes);
    `
    let stmt = db.prepare<Omit<User,'id'>,User>(sql)
    let result = stmt.run(body)

    if (result.changes === 0) {
        return c.json({ message: 'User not created' },500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = `SELECT * FROM users WHERE id = ?`
    let stmt2 = db.prepare<[number],User>(sql2)
    let newUser  = stmt2.get(lastRowid)
    return c.json({ message: 'User created',data: newUser } ,201)
})


const updateUserSchema = z.object({
    AppointmentID: z.string().optional(),
    Date: z.string().optional(),
    Time: z.string().optional(),
    Status: z.string().optional(),
    Notes: z.string().optional(),
})
userRoutes.put('/:id',
    zValidator('json', updateUserSchema),async (c) => {
    const { id } = c.req.param()
    const body = await c.req.json()

    const exists = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!exists) return c.json({ message: 'User not found' }, 404)

    const sql = `
        UPDATE users SET
            Appointment_ID = COALESCE(@Appointment_ID, Appointment_ID),
            Date = COALESCE(@Date, Date),
            Time = COALESCE(@Time, Time),
            Status = COALESCE(@Status, Status)
            Notes = COALESCE(@Notes, @Notes)
        WHERE id = @id
    `
    const stmt = db.prepare(sql)
    stmt.run({ ...body, id })

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id)

    return c.json({ message: 'User updated', data: updated })
    }
)

userRoutes.delete('/:id', (c) => {
    const { id } = c.req.param()

    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
    return c.json({ message: 'User not found' }, 404)
    }

    return c.json({ message: 'User deleted', id })
})

export default userRoutes 