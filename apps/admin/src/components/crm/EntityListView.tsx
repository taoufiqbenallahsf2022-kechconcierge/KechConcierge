import {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import type {EntityConfig,Field} from '../../config/entities';
import {DisplayValue} from '../DisplayValue';
import {useDeleteOneMutation,useListQuery} from '../../store/api';

type Props={config:EntityConfig;entity:string;detailPath?:(id:string)=>string};
type DateOperator='between'|'before'|'after';

export function EntityListView({config,entity,detailPath=(id)=>`/entities/${entity}/${id}`} : Props){
 const [search,setSearch]=useState(''); const [fieldName,setFieldName]=useState(''); const [textValue,setTextValue]=useState('');
 const [booleanValue,setBooleanValue]=useState(''); const [dateOperator,setDateOperator]=useState<DateOperator>('between');
 const [dateFrom,setDateFrom]=useState(''); const [dateTo,setDateTo]=useState(''); const [page,setPage]=useState(1);
 const selectedField=config.fields.find(f=>f.name===fieldName);
 const params=useMemo(()=>{
   const p:Record<string,string>={page:String(page),pageSize:'20'}; if(search)p.search=search;
   if(selectedField?.kind==='boolean'&&booleanValue){p.filterField=fieldName;p.filterValue=booleanValue;}
   else if(selectedField&&(selectedField.kind==='date'||selectedField.kind==='datetime')){
     if(dateOperator==='between'){if(dateFrom)p[`${fieldName}From`]=dateFrom;if(dateTo)p[`${fieldName}To`]=endOfDay(dateTo)}
     if(dateOperator==='after'&&dateFrom)p[`${fieldName}From`]=dateFrom;
     if(dateOperator==='before'&&dateTo)p[`${fieldName}To`]=endOfDay(dateTo);
   } else if(fieldName&&textValue){p.filterField=fieldName;p.filterValue=textValue;}
   return p;
 },[page,search,fieldName,textValue,booleanValue,dateOperator,dateFrom,dateTo,selectedField]);
 const {data,isLoading,error}=useListQuery({entity,params}); const [remove]=useDeleteOneMutation();
 function resetFilter(){setFieldName('');setTextValue('');setBooleanValue('');setDateFrom('');setDateTo('');setPage(1)}
 return <section><header className="pagehead"><div><div className="eyebrow">Data management</div><h1>{config.plural}</h1><p>{data?.total??0} records</p></div>{!config.readOnly&&<Link className="primary" to={`/entities/${entity}/new`}>+ New {config.label}</Link>}</header>
 <div className="toolbar typed-toolbar"><div className="searchbox"><span>⌕</span><input placeholder={`Search ${config.plural.toLowerCase()}…`} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div>
 <select value={fieldName} onChange={e=>{setFieldName(e.target.value);setTextValue('');setBooleanValue('');setDateFrom('');setDateTo('');setPage(1)}}><option value="">Filter by field</option>{filterable(config.fields).map(f=><option key={f.name} value={f.name}>{f.label}</option>)}</select>
 <FilterInput field={selectedField} textValue={textValue} setTextValue={setTextValue} booleanValue={booleanValue} setBooleanValue={setBooleanValue} dateOperator={dateOperator} setDateOperator={setDateOperator} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}/>
 {(fieldName||search)&&<button className="link-button" onClick={()=>{setSearch('');resetFilter()}}>Clear</button>}</div>
 {isLoading?<div className="empty-state">Loading records…</div>:error?<div className="alert error">Could not load data.</div>:<div className="tablewrap entity-table"><table><thead><tr>{config.listFields.map(c=><th key={c}>{config.fields.find(f=>f.name===c)?.label??c}</th>)}<th></th></tr></thead><tbody>{data?.items.map(row=><tr key={String(row.id)} onDoubleClick={()=>location.assign(detailPath(String(row.id)))}>{config.listFields.map(c=><td key={c}><DisplayValue field={config.fields.find(f=>f.name===c)} value={row[c]}/></td>)}<td className="actions"><Link to={detailPath(String(row.id))}>View</Link>{!config.readOnly&&<button onClick={()=>confirm('Delete this record?')&&remove({entity,id:String(row.id)})}>Delete</button>}</td></tr>)}</tbody></table>{!data?.items.length&&<div className="empty-state">No records found.</div>}</div>}
 <footer className="pager"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {data?.pages??1}</span><button disabled={page>=(data?.pages??1)} onClick={()=>setPage(p=>p+1)}>Next</button></footer></section>
}
function filterable(fields:Field[]){return fields.filter(f=>!['keyValue','tags','image','textarea','password'].includes(f.kind))}
function endOfDay(value:string){return value?`${value}T23:59:59.999Z`:value}
function FilterInput(p:{field?:Field;textValue:string;setTextValue:(v:string)=>void;booleanValue:string;setBooleanValue:(v:string)=>void;dateOperator:DateOperator;setDateOperator:(v:DateOperator)=>void;dateFrom:string;setDateFrom:(v:string)=>void;dateTo:string;setDateTo:(v:string)=>void}){
 if(!p.field)return null;
 if(p.field.kind==='boolean')return <select className="filter-value" value={p.booleanValue} onChange={e=>p.setBooleanValue(e.target.value)}><option value="">Select value</option><option value="true">True</option><option value="false">False</option><option value="null">Null</option></select>;
 if(p.field.kind==='date'||p.field.kind==='datetime')return <div className="date-filter"><select value={p.dateOperator} onChange={e=>p.setDateOperator(e.target.value as DateOperator)}><option value="between">Between</option><option value="after">After</option><option value="before">Before</option></select>{p.dateOperator!=='before'&&<input type="date" value={p.dateFrom} onChange={e=>p.setDateFrom(e.target.value)}/>} {p.dateOperator!=='after'&&<input type="date" value={p.dateTo} onChange={e=>p.setDateTo(e.target.value)}/>}</div>;
 if(p.field.kind==='enum')return <select className="filter-value" value={p.textValue} onChange={e=>p.setTextValue(e.target.value)}><option value="">Select value</option>{p.field.options?.map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}<option value="null">Null</option></select>;
 return <input className="filter-value" placeholder="Filter value" value={p.textValue} onChange={e=>p.setTextValue(e.target.value)}/>;
}
