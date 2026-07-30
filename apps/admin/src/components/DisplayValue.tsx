import type {Field} from '../config/entities';
export function formatDate(value:unknown,withTime=true){if(!value)return '—';const d=new Date(String(value));if(Number.isNaN(d.getTime()))return String(value);return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',...(withTime?{timeStyle:'short'}:{})}).format(d)}
export function DisplayValue({field,value}:{field?:Field;value:unknown}){
 if(value===null||value===undefined||value==='')return <span className="muted">—</span>;
 if(field?.kind==='boolean')return <span className={`badge ${value?'success':'neutral'}`}>{value?'Yes':'No'}</span>;
 if(field?.kind==='datetime'||field?.kind==='date')return <>{formatDate(value,field.kind==='datetime')}</>;
 if(field?.kind==='image')return <a href={String(value)} target="_blank" rel="noreferrer"><img className="field-image" src={String(value)} alt={field.label}/></a>;
 if(field?.kind==='tags'&&Array.isArray(value))return <div className="tag-list">{value.map((x,i)=><span className="tag" key={i}>{String(x)}</span>)}</div>;
 if(field?.kind==='keyValue'&&Array.isArray(value))return <div className="kv-list">{value.map((item,i)=><div key={i}><b>{String(item?.label??'')}</b><span>{String(item?.value??'')}</span></div>)}</div>;
 if(field?.kind==='keyValue'&&value&&typeof value==='object')return <div className="kv-list">{Object.entries(value as Record<string,unknown>).map(([k,v])=><div key={k}><b>{k}</b><span>{String(v)}</span></div>)}</div>;
 if(field?.kind==='email')return <a href={`mailto:${String(value)}`}>{String(value)}</a>;
 if(field?.kind==='phone')return <a href={`tel:${String(value)}`}>{String(value)}</a>;
 if(field?.kind==='enum'||['status','source','managedBy','participantStage','channelStatus','type','role'].some(x=>field?.name.toLowerCase().includes(x.toLowerCase())))return <span className="badge">{String(value).replaceAll('_',' ')}</span>;
 return <span className={field?.kind==='textarea'?'preline':''}>{String(value)}</span>;
}
