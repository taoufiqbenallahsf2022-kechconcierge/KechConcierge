import {useParams} from 'react-router-dom';import {entityMap} from '../../config/entities';import {useGetOneQuery} from '../../store/api';import {EntityListView} from '../../components/crm/EntityListView';import {EntityCreateView} from '../../components/crm/EntityCreateView';import {EntityDetailShell} from '../../components/crm/EntityDetailShell';
const entity='users',config=entityMap[entity];
export function UsersList(){return <EntityListView entity={entity} config={config}/>}
export function UsersCreate(){return <EntityCreateView entity={entity} config={config}/>}
export function UsersDetail(){const {id=''}=useParams();const {data,isLoading,error}=useGetOneQuery({entity,id});if(isLoading)return <div className="empty-state">Loading record…</div>;if(error||!data)return <div className="empty-state">Record not found.</div>;return <EntityDetailShell entity={entity} id={id} config={config} data={data}></EntityDetailShell>}
