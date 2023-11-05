import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFireproof } from 'use-fireproof'
import { InlineEditor } from '../components/InlineEditor'

import { useForm } from 'react-hook-form'

import usePartySocket from 'partysocket/react'

import catImage from '../assets/cat.png';

type MsgData = { _id: string; msg: string; done?: boolean }


const dbName = localStorage.getItem('dbName') || Math.random().toString(36).substring(2)
localStorage.setItem('dbName', dbName)

const PUBLIC_PARTYKIT_HOST=`127.0.0.1:1999`

export function Chat() {
  const { id } = useParams<{ id: string }>()
  const { register, handleSubmit, resetField} = useForm()
  const { database } = useFireproof(dbName)

  const [incomingMessage, setIncomingMessage] = useState<MsgData>({_id: '', msg: ''})


  const socket = usePartySocket({
    host : PUBLIC_PARTYKIT_HOST,
    room : dbName,
    onOpen(e) {
      console.log('open', e)
    },
    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data)
      setIncomingMessage(message)
      console.log('message', message)
    }
  })

  function sendMessage(formData) {
    console.log('sendMessage', formData)
    socket.send(JSON.stringify(formData))
    resetField('msg');
  }

  console.log('Chat', socket, dbName, id)

  return (
    <div className="w-screen h-screen">
      <div className="flex flex-col flex-grow p-4 overflow-auto">
        <div className="flex w-full mt-2 space-x-3 max-w-sm">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
          <div>
            <div className="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
            <img className="mb-2 rounded" src={catImage} alt="Description of Image" />
              <p className="text-sm">
                Hi, I'm Fluffy, welcome to cat chat. You can ask "meow" anything. What do you want to know?
              </p>
            </div>
            <span className="text-xs text-gray-500 leading-none">2 min ago</span>
          </div>
        </div>

        <div className="flex w-full mt-2 space-x-3 max-w-sm ml-auto justify-end">
          <div>
            <div className="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
              <p className="text-sm">Would you rather chase a mouse or yarn?</p>
            </div>
            <span className="text-xs text-gray-500 leading-none">2 min ago</span>
          </div>
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
        </div>
      </div>



{incomingMessage.msg && (<div className="flex w-full mt-2 space-x-3 max-w-sm">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
          <div>
            <div className="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
            {/* <img className="mb-2 rounded" src={catImage} alt="Description of Image" /> */}
              <p className="text-sm">
                {incomingMessage.msg}
              </p>
            </div>
            <span className="text-xs text-gray-500 leading-none">2 min ago</span>
          </div>
        </div>)}

      <div className="fixed bottom-0 w-full bg-gray-300 p-4">
        <form onSubmit={handleSubmit(sendMessage)} className="flex items-center">
          <input {...register("msg")} className="flex-grow h-10 rounded px-3 text-sm" type="text" placeholder="Type your message…" autoComplete="off" />
          <button type="submit" className="ml-2 bg-blue-600 hover:bg-blue-500 text-white rounded px-3">Send</button>
        </form>
      </div>
    </div>
  )
}
