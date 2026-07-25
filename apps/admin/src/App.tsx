import {Navigate,Route,Routes} from 'react-router-dom';import {Layout} from './components/Layout';
import {IndividualList,IndividualCreate,IndividualDetail} from './features/individuals/IndividualPages';
import {ProductsList,ProductsCreate,ProductsDetail} from './features/products/ProductsPages';
import {LeadsList,LeadsCreate,LeadsDetail} from './features/leads/LeadsPages';
import {ProspectsList,ProspectsCreate,ProspectsDetail} from './features/prospects/ProspectsPages';
import {AccountsList,AccountsCreate,AccountsDetail} from './features/accounts/AccountsPages';
import {ConsentsList,ConsentsCreate,ConsentsDetail} from './features/consents/ConsentsPages';
import {UsersList,UsersCreate,UsersDetail} from './features/users/UsersPages';
import {useAuth} from './auth/AuthContext';
import {LoginPage} from './pages/LoginPage';
import {PageVisitsList,PageVisitsDetail} from './features/page-visits/PageVisitsPages';
import {ContactRequestsList,ContactRequestsDetail} from './features/contact-requests/ContactRequestsPages';
import {ChatList,ChatDetail} from './features/chats/ChatPages';
import {WhatsappConversationsList,WhatsappConversationsDetail} from './features/whatsapp-conversations/WhatsappConversationsPages';
import {WhatsappMessagesList,WhatsappMessagesDetail} from './features/whatsapp-messages/WhatsappMessagesPages';
import {ChatMessagesList,ChatMessagesDetail} from './features/chat-messages/ChatMessagesPages';
function C({list:List,create:Create,detail:Detail,path}:{list:any;create?:any;detail:any;path:string}){return <><Route path={`entities/${path}`} element={<List/>}/>{Create&&<Route path={`entities/${path}/new`} element={<Create/>}/>}<Route path={`entities/${path}/:id`} element={<Detail/>}/></>}
export default function App(){const {user,loading}=useAuth();if(loading)return <div className="auth-loading"><div className="brand-mark">M</div><span>Opening your workspace…</span></div>;if(!user)return <LoginPage/>;return <Routes><Route element={<Layout/>}><Route index element={<Navigate to="/entities/individuals" replace/>}/>{C({list:IndividualList,create:IndividualCreate,detail:IndividualDetail,path:'individuals'})}{C({list:ProductsList,create:ProductsCreate,detail:ProductsDetail,path:'products'})}{C({list:LeadsList,create:LeadsCreate,detail:LeadsDetail,path:'leads'})}{C({list:ProspectsList,create:ProspectsCreate,detail:ProspectsDetail,path:'prospects'})}{C({list:AccountsList,create:AccountsCreate,detail:AccountsDetail,path:'accounts'})}{C({list:ConsentsList,create:ConsentsCreate,detail:ConsentsDetail,path:'consents'})}{C({list:UsersList,create:UsersCreate,detail:UsersDetail,path:'users'})}{C({list:PageVisitsList,detail:PageVisitsDetail,path:'page-visits'})}{C({list:ContactRequestsList,detail:ContactRequestsDetail,path:'contact-requests'})}<Route path="entities/chats" element={<ChatList/>}/><Route path="chats/:id" element={<ChatDetail/>}/>{C({list:WhatsappConversationsList,detail:WhatsappConversationsDetail,path:'whatsapp-conversations'})}{C({list:WhatsappMessagesList,detail:WhatsappMessagesDetail,path:'whatsapp-messages'})}{C({list:ChatMessagesList,detail:ChatMessagesDetail,path:'chat-messages'})}</Route></Routes>}
