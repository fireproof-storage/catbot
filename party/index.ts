import type * as Party from 'partykit/server'
import { verifyToken } from '@clerk/backend'

import { AI } from './ai'

import { fireproof } from '@fireproof/core/memory'
import { connect } from '@fireproof/partykit'
import { ok, json } from './utils/response'

const DEFAULT_CLERK_ENDPOINT = 'https://divine-mule-93.clerk.accounts.dev'

export default class Server implements Party.Server {
  ai: AI

  constructor(readonly party: Party.Party) {
    this.ai = new AI(this.party.env['OPEN_AI_API_KEY'] as string)
  }

  static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
    try {
      // get authentication server url from environment variables (optional)
      const issuer = lobby.env.CLERK_ENDPOINT || DEFAULT_CLERK_ENDPOINT
      // get token from request query string
      const token = new URL(request.url).searchParams.get('token') ?? ''
      // verify the JWT (in this case using clerk)
      const session = await verifyToken(token, { issuer })
      // pass any information to the onConnect handler in headers (optional)
      request.headers.set('X-User-ID', session.sub)
      // forward the request onwards on onConnect
      return request
    } catch (e) {
      // authentication failed!
      // short-circuit the request before it's forwarded to the party
      return new Response('Unauthorized', { status: 401 })
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.party.id}
  url: ${new URL(ctx.request.url).pathname}`
    )
  }

  async onMessage(
    message: string //sender: Party.Connection
  ) {
    // let's log the message
    const data = JSON.parse(message)
    // console.log('message', message)

    await this.ai.userMessage(data.msg, data.history || [], async data => {
      // console.log('data', data._id)
      // sender.send(JSON.stringify(data))
      this.party.broadcast(JSON.stringify(data))
    })
  }



  async onRequest(request: Party.Request) {
    const dbName = this.party.id //+ "-backend"
    // const database = fireproof(dbName)
    // const connection = connect.partykit(database, this.party.env['PARTYKIT_HOST'] as string)

    const { database, connection } = await connectDb(dbName, this.party.env['PARTYKIT_HOST'] as string)

    if (request.method === 'GET') {
      
      // await connection.loaded

      console.log('connection ready', connection)

      // const ok = await database.put({test : 'test'})
      const data = await database.allDocs()
      return json({data})
    }
    // respond to cors preflight requests
    if (request.method === 'OPTIONS') {
      return ok()
    }

    return new Response('Method not allowed', { status: 405 })
  }
}

async function connectDb(dbName: string, host: string) {
  const database = fireproof(dbName)
  const connection = connect.partykit(database, host)
  await connection.loaded
  await sleep(2000)
  const data = await database.allDocs()
  console.log('data', data.rows.length)
  return { database, connection }
}


async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Server satisfies Party.Worker
