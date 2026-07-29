import {Link,useParams} from 'react-router-dom';import {entityMap} from '../../config/entities';import {useGetOneQuery} from '../../store/api';import {EntityListView} from '../../components/crm/EntityListView';import {EntityCreateView} from '../../components/crm/EntityCreateView';import {EntityDetailShell} from '../../components/crm/EntityDetailShell';
const entity='prospects',config=entityMap[entity];
export function ProspectsList(){return <EntityListView entity={entity} config={config}/>}
export function ProspectsCreate(){return <EntityCreateView entity={entity} config={config}/>}
export function ProspectsDetail(){const {id=''}=useParams();const {data,isLoading,error}=useGetOneQuery({entity,id});if(isLoading)return <div className="empty-state">Loading record…</div>;if(error||!data)return <div className="empty-state">Record not found.</div>;
 const renderField=(field:any,value:unknown)=>field.name==='individualId'&&value?<Link className="record-link" to={`/entities/individuals/${value}`}>{String(value)}</Link>:undefined;
return <EntityDetailShell entity={entity} id={id} config={config} data={data} renderField={renderField}></EntityDetailShell>}
