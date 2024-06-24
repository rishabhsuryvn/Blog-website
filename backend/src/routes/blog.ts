import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import {createblogInput,updateblogInput} from '@rishabhsuryvn/common'
export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string
    }
  }>()
  blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    const user = await verify(authHeader, c.env.JWT_SECRET);

    if (user) {
        //@ts-ignore
        c.set("userId", user.id);
        await next();
    } else {
        c.status(403)
        return c.json({
            message: "You are not logged in"
        });
    }
});


blogRouter.post('/', async(c) => {
    const body = await c.req.json()
    const {success} = createblogInput.safeParse(body)

    if(!success){
      c.status(411)
      return c.json({
        error: "incorrect input"
      })
    }
    const userId = c.get("userId")
    const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: userId
		}
	});
	return c.json({
		id: post.id
	});
  })
  
blogRouter.put('/', async(c) => {
    const body = await c.req.json()
    const {success} = updateblogInput.safeParse(body)

    if(!success){
      c.status(411)
      return c.json({
        error: "incorrect input"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

   await prisma.post.update ({
     where:{
        id: body.id
     },

    data:{
            title: body.title,
            content: body.content,
            
        }
  })

     return c.text("uppdated post")

  })
  blogRouter.get('/bulk', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const post = await prisma.post.findMany({
          select:{
            content:true,
            title: true,
            id: true,
            author: {
              select:{
                name: true
              }
            }
          }
    })

    return c.json({
        post
    })
  })

  
blogRouter.get('/:id', async(c) => {
    const id = c.req.param("id")
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())


  try {
  const post =   await prisma.post.findFirst ({
        where:{
           id: id
        },
     })
   
        return c.json({
            post
        })
   
  } catch (e) {
     c.status(400)
    return c.json({
        message: "erorr while fetching post"
    })
  }
   
  })
  
  
