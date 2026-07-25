import {useParams} from 'react-router-dom';import {entityMap} from '../../config/entities';import {EntityListView} from '../../components/crm/EntityListView';import {ChatConsole} from '../../pages/ChatConsole';
export function ChatList(){return <EntityListView entity="chats" config={entityMap.chats} detailPath={id=>`/chats/${id}`}/>}
export function ChatDetail(){const {id=''}=useParams();return <ChatConsole key={id}/>}
