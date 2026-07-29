import {FormEvent,useEffect,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useGetOneQuery,useSendChatMutation,useSetChatTypingMutation} from '../store/api';
import {formatDate} from '../components/DisplayValue';

const END_USER_TYPES=new Set(['VISITOR','INDIVIDUAL','LEAD','PROSPECT','ACCOUNT']);

export function ChatConsole(){
 const {id=''}=useParams();
 const {data,isLoading,error,refetch}=useGetOneQuery({entity:'chats',id},{pollingInterval:1500});
 const [send,{isLoading:sending}]=useSendChatMutation();
 const [setTyping]=useSetChatTypingMutation();
 const [text,setText]=useState('');
 const typingSentAt=useRef(0);
 const streamRef=useRef<HTMLDivElement>(null);
 const messages=(data?.messages??[]) as Record<string,unknown>[];
 const endUserTyping=!!data?.endUserTypingUntil&&new Date(String(data.endUserTypingUntil)).getTime()>Date.now();

 useEffect(()=>{streamRef.current?.scrollTo({top:streamRef.current.scrollHeight,behavior:'smooth'})},[messages.length,endUserTyping]);
 async function submit(e:FormEvent){e.preventDefault();if(!text.trim())return;await send({id,message:text.trim()}).unwrap();setText('');await setTyping({id,typing:false});void refetch()}
 function change(value:string){setText(value);if(!value.trim()){void setTyping({id,typing:false});return}if(Date.now()-typingSentAt.current>2500){typingSentAt.current=Date.now();void setTyping({id,typing:true})}}

 if(isLoading)return <div className="empty-state">Loading conversation…</div>;
 if(error||!data)return <div className="alert error">Conversation not found.</div>;
 const individual=data.individual as {firstName?:string;lastName?:string;email?:string}|undefined;
 const customerName=individual?`${individual.firstName??''} ${individual.lastName??''}`.trim()||individual.email:'Visitor';
 return <div className="chat-page">
  <div className="breadcrumb"><Link to="/entities/chats">Website Chats</Link><span>/</span><span>{customerName}</span></div>
  <header className="record-header chat-header"><div><div className="eyebrow">Website conversation</div><h1>{customerName} - Assistant</h1><p>{String(data.participantStage??'Visitor').replaceAll('_',' ')} · {data.visitorId?`Visitor ID ${data.visitorId}`:`Individual ID ${data.individualId??'—'}`} · Last activity {formatDate(data.updatedDate)}</p></div><div className="chat-status"><span className="badge">{String(data.status??'OPEN').replaceAll('_',' ')}</span><span className="badge neutral">{String(data.language??'en').toUpperCase()}</span></div></header>
  <section className="chat-window"><div className="message-stream" ref={streamRef}>{messages.length?messages.map((m,i)=>{const mine=['ADVISOR','AI'].includes(String(m.senderType));return <article className={`chat-bubble ${mine?'mine':''}`} key={String(m.id??i)}><div className="bubble-meta"><b>{mine?'Advisor':customerName}</b><span>{formatDate(m.sendTime)}</span></div><p>{String(m.message??'')}</p>{mine&&<small className="message-read-state">{m.isRead?'Seen':'Sent'}</small>}</article>}):<div className="empty-state">No messages yet.</div>}{endUserTyping&&<div className="typing-indicator">{customerName} is typing<span>…</span></div>}</div>
  <form className="composer" onSubmit={submit}><textarea rows={3} value={text} onChange={e=>change(e.target.value)} placeholder={`Reply to ${customerName}…`}/><button className="primary" disabled={sending||!text.trim()}>{sending?'Sending…':'Send reply'}</button></form></section>
 </div>
}
