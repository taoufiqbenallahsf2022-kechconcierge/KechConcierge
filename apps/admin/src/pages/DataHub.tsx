import {Link} from 'react-router-dom';
import {entities} from '../config/entities';

const descriptions:Record<string,string>={
 individuals:'Customer identities and preferences',leads:'Early customer interest',prospects:'Qualified opportunities',accounts:'Established customer relationships',consents:'Communication permissions',products:'Concierge catalogue',chats:'Website conversations','whatsapp-conversations':'WhatsApp conversations','whatsapp-messages':'WhatsApp message history','chat-messages':'Website chat messages','contact-requests':'Inbound customer requests','page-visits':'Digital behavior and visits'
};

export function DataHub(){
 const objects=entities.filter(entity=>entity.key!=='users');
 return <section><header className="studio-hero"><div><div className="eyebrow">Data Hub</div><h1>Your business objects</h1><p>Explore and manage the connected records that power Moorish Concierge.</p></div><div className="studio-metric"><b>{objects.length}</b><span>Objects available</span></div></header><div className="hub-grid">{objects.map((entity,index)=><Link className="hub-card" to={entity.key==='chats'?'/entities/chats':`/entities/${entity.key}`} key={entity.key}><span className="hub-index">{String(index+1).padStart(2,'0')}</span><h2>{entity.plural}</h2><p>{descriptions[entity.key]??'Business data and related records'}</p><span className="hub-open">Open object →</span></Link>)}</div></section>
}
