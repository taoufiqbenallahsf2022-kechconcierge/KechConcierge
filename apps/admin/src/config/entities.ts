import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(enCountries);
export type FieldKind='text'|'email'|'phone'|'textarea'|'number'|'boolean'|'date'|'datetime'|'password'|'enum'|'image'|'tags'|'keyValue';
export type FieldOption=string|{value:string;label:string};
export type Field={name:string;label:string;kind:FieldKind;required?:boolean;options?:FieldOption[];readOnly?:boolean;hiddenInForm?:boolean;section?:string;placeholder?:string};
export type EntityConfig={key:string;label:string;plural:string;readOnly?:boolean;dateFields?:string[];titleFields:string[];subtitleFields?:string[];listFields:string[];fields:Field[]};
const person:Field[]=[
{name:'firstName',label:'First name',kind:'text',required:true,section:'Personal information'},
{name:'lastName',label:'Last name',kind:'text',required:true,section:'Personal information'},
{name:'email',label:'Email',kind:'email',section:'Contact information'},
{name:'mobilePhone',label:'Mobile phone',kind:'phone',section:'Contact information'},
{name:'address',label:'Address',kind:'textarea',section:'Contact information'},
{name:'birthdate',label:'Birthdate',kind:'date',section:'Personal information'},
{name:'country',label:'Country',kind:'enum',options:Object.entries(countries.getNames('en',{select:'official'})).map(([alpha2,label])=>({value:countries.alpha2ToAlpha3(alpha2)??'',label:`${label} (${countries.alpha2ToAlpha3(alpha2)})`})).filter(option=>option.value).sort((a,b)=>a.label.localeCompare(b.label)),section:'Personal information'},
{name:'language',label:'Language',kind:'enum',required:true,options:['en','fr','de','it','pt','es','ar'],section:'Personal information'},
{name:'source',label:'Source',kind:'text',readOnly:true,hiddenInForm:true,section:'System information'}
];
const audit:Field[]=[
{name:'createdDate',label:'Created date',kind:'datetime',readOnly:true,section:'System information'},
{name:'createdBy',label:'Created by',kind:'text',readOnly:true,section:'System information'},
{name:'updatedDate',label:'Last modified',kind:'datetime',readOnly:true,section:'System information'},
{name:'updatedBy',label:'Modified by',kind:'text',readOnly:true,section:'System information'}
];
const productLanguages=['EN','FR','DE','IT','PT','ES'];
const productLocalized:Field[]=productLanguages.flatMap(lang=>[
{name:`title${lang}`,label:`Title (${lang})`,kind:'text',section:`Content · ${lang}`},
{name:`subtitle${lang}`,label:`Subtitle (${lang})`,kind:'text',section:`Content · ${lang}`},
{name:`priceTitle${lang}`,label:`Price label (${lang})`,kind:'text',section:`Content · ${lang}`},
{name:`description${lang}`,label:`Description (${lang})`,kind:'textarea',section:`Content · ${lang}`},
{name:`address${lang}`,label:`Address (${lang})`,kind:'textarea',section:`Content · ${lang}`},
{name:`tags${lang}`,label:`Tags (${lang})`,kind:'tags',section:`Content · ${lang}`},
{name:`details${lang}`,label:`Details (${lang})`,kind:'keyValue',section:`Content · ${lang}`}
]);
const imageFields:Field[]=Array.from({length:21},(_,i)=>({name:`image${i+1}`,label:`Image ${i+1}`,kind:'image',section:'Gallery'}));
export const entities:EntityConfig[]=[
{key:'individuals',label:'Individual',plural:'Individuals',titleFields:['firstName','lastName'],subtitleFields:['manualEmail','email','mobilePhone'],listFields:['firstName','lastName','manualEmail','email','mobilePhone','source','isActive','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[...person.map(field=>field.name==='email'?{...field,name:'manualEmail',label:'Manual email'}:field),{name:'email',label:'Account email',kind:'email',readOnly:true,hiddenInForm:true,section:'Authentication'},{name:'authProvider',label:'Authentication provider',kind:'text',readOnly:true,section:'Authentication'},{name:'isActive',label:'Active',kind:'boolean',section:'Status'},{name:'emailVerified',label:'Email verified',kind:'boolean',section:'Status'},{name:'lastSuccessfulLoginDate',label:'Last successful login',kind:'datetime',readOnly:true,section:'Authentication'},...audit]},
{key:'leads',label:'Lead',plural:'Leads',titleFields:['firstName','lastName'],subtitleFields:['email'],listFields:['firstName','lastName','email','mobilePhone','statusDescription','source','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[...person,{name:'statusDescription',label:'Status',kind:'text',required:true,section:'Status'},{name:'individualId',label:'Individual ID',kind:'text',required:true,section:'Relationships'},...audit]},
{key:'prospects',label:'Prospect',plural:'Prospects',titleFields:['firstName','lastName'],subtitleFields:['email'],listFields:['firstName','lastName','email','mobilePhone','statusDescription','source','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[...person,{name:'statusDescription',label:'Status',kind:'text',required:true,section:'Status'},{name:'individualId',label:'Individual ID',kind:'text',required:true,section:'Relationships'},...audit]},
{key:'accounts',label:'Account',plural:'Accounts',titleFields:['firstName','lastName'],subtitleFields:['email'],listFields:['firstName','lastName','email','mobilePhone','statusDescription','source','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[...person,{name:'statusDescription',label:'Status',kind:'text',required:true,section:'Status'},{name:'individualId',label:'Individual ID',kind:'text',required:true,section:'Relationships'},...audit]},
{key:'products',label:'Product',plural:'Products',titleFields:['titleEN','uniqueCode'],subtitleFields:['type'],listFields:['thumbnail','uniqueCode','titleEN','type','priceEuro','isActive','updatedAt'],dateFields:['createdAt','updatedAt'],fields:[
{name:'uniqueCode',label:'Unique code',kind:'text',required:true,section:'General information'},
{name:'type',label:'Product type',kind:'enum',required:true,options:['VILLA','SWIMMINGPOOL','SPA','RESTAURANT','ACTIVITY','TRANSPORTATION'],section:'General information'},
{name:'priceEuro',label:'Price (€)',kind:'number',section:'General information'},
{name:'order',label:'Display order',kind:'number',section:'General information'},
{name:'thumbnail',label:'Thumbnail',kind:'image',required:true,section:'Media'},
{name:'isActive',label:'Active',kind:'boolean',section:'Status'},
...imageFields,...productLocalized,
{name:'createdAt',label:'Created date',kind:'datetime',readOnly:true,section:'System information'},
{name:'updatedAt',label:'Last modified',kind:'datetime',readOnly:true,section:'System information'}]},
{key:'consents',label:'Consent',plural:'Consents',titleFields:['channel'],subtitleFields:['channelStatus'],listFields:['individualId','channel','channelStatus','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[{name:'individualId',label:'Individual ID',kind:'text',required:true,section:'Relationship'},{name:'channel',label:'Channel',kind:'enum',required:true,options:['EMAIL','SMS','WHATSAPP','PHONE'],section:'Consent'},{name:'channelStatus',label:'Status',kind:'enum',options:['OPTIN','UNKNOWN','OPTOUT'],section:'Consent'},...audit]},
{key:'users',label:'User',plural:'Users',titleFields:['firstName','lastName'],subtitleFields:['email','role'],listFields:['firstName','lastName','email','role','isActive','lastLoginDate','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[{name:'firstName',label:'First name',kind:'text',required:true,section:'Identity'},{name:'lastName',label:'Last name',kind:'text',required:true,section:'Identity'},{name:'email',label:'Email',kind:'email',required:true,section:'Contact'},{name:'password',label:'Password',kind:'password',section:'Security'},{name:'mobilePhone',label:'Mobile phone',kind:'phone',section:'Contact'},{name:'role',label:'Role',kind:'enum',required:true,options:['ADMIN','ADVISOR','MANAGER'],section:'Access'},{name:'isActive',label:'Active',kind:'boolean',section:'Access'},{name:'lastLoginDate',label:'Last login',kind:'datetime',readOnly:true,section:'System information'},...audit]},
{key:'page-visits',label:'Page Visit',plural:'Page Visits',readOnly:true,titleFields:['pageName','pageUrl'],subtitleFields:['visitorStage'],listFields:['pageName','pageUrl','visitorStage','visitorId','visitDate','sessionId'],dateFields:['visitDate'],fields:[{name:'pageName',label:'Page name',kind:'text',section:'Visit'},{name:'pageUrl',label:'Page URL',kind:'text',section:'Visit'},{name:'visitorStage',label:'Visitor stage',kind:'enum',options:['LEAD','PROSPECT','ACCOUNT','ANONYMOUS'],section:'Visitor'},{name:'visitorId',label:'Visitor ID',kind:'text',section:'Visitor'},{name:'visitDate',label:'Visit date',kind:'datetime',section:'Visit'},{name:'referrer',label:'Referrer',kind:'text',section:'Technical information'},{name:'sessionId',label:'Session ID',kind:'text',section:'Technical information'},{name:'userAgent',label:'Browser / device',kind:'textarea',section:'Technical information'},{name:'ipAddress',label:'IP address',kind:'text',section:'Technical information'},{name:'individualId',label:'Individual ID',kind:'text',section:'Relationships'},{name:'leadId',label:'Lead ID',kind:'text',section:'Relationships'},{name:'prospectId',label:'Prospect ID',kind:'text',section:'Relationships'},{name:'accountId',label:'Account ID',kind:'text',section:'Relationships'}]},
{key:'contact-requests',label:'Contact Request',plural:'Contact Requests',readOnly:true,titleFields:['subject','requestType'],subtitleFields:['email'],listFields:['firstName','lastName','email','requestType','subject','createdDate'],dateFields:['createdDate','updatedDate'],fields:[{name:'firstName',label:'First name',kind:'text',section:'Requester'},{name:'lastName',label:'Last name',kind:'text',section:'Requester'},{name:'email',label:'Email',kind:'email',section:'Requester'},{name:'mobilePhone',label:'Mobile phone',kind:'phone',section:'Requester'},{name:'requestType',label:'Request type',kind:'text',section:'Request'},{name:'requesterStage',label:'Requester stage',kind:'text',section:'Requester'},{name:'subject',label:'Subject',kind:'text',section:'Request'},{name:'comment',label:'Message',kind:'textarea',section:'Request'},{name:'createdDate',label:'Received',kind:'datetime',section:'System information'},{name:'individualId',label:'Individual ID',kind:'text',section:'Relationships'},{name:'leadId',label:'Lead ID',kind:'text',section:'Relationships'},{name:'prospectId',label:'Prospect ID',kind:'text',section:'Relationships'},{name:'accountId',label:'Account ID',kind:'text',section:'Relationships'}]},
{key:'chats',label:'Website Chat',plural:'Website Chats',readOnly:true,titleFields:['id'],subtitleFields:['status','managedBy'],listFields:['participantStage','visitorId','individualId','status','managedBy','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[{name:'participantStage',label:'Participant',kind:'text',section:'Conversation'},{name:'managedBy',label:'Managed by',kind:'text',section:'Conversation'},{name:'status',label:'Status',kind:'text',section:'Conversation'},{name:'language',label:'Language',kind:'text',section:'Conversation'},{name:'visitorId',label:'Visitor ID',kind:'text',section:'Relationships'},{name:'sessionId',label:'Session ID',kind:'text',section:'Relationships'},{name:'individualId',label:'Individual ID',kind:'text',section:'Relationships'},{name:'leadId',label:'Lead ID',kind:'text',section:'Relationships'},{name:'prospectId',label:'Prospect ID',kind:'text',section:'Relationships'},{name:'accountId',label:'Account ID',kind:'text',section:'Relationships'},{name:'advisorId',label:'Advisor ID',kind:'text',section:'Assignment'},{name:'createdDate',label:'Started',kind:'datetime',section:'System information'},{name:'updatedDate',label:'Last activity',kind:'datetime',section:'System information'}]},
{key:'whatsapp-conversations',label:'WhatsApp Conversation',plural:'WhatsApp Conversations',readOnly:true,titleFields:['displayName','whatsappPhone'],subtitleFields:['managedBy'],listFields:['displayName','whatsappPhone','managedBy','updatedDate'],dateFields:['createdDate','updatedDate'],fields:[{name:'displayName',label:'Customer name',kind:'text',section:'Customer'},{name:'whatsappPhone',label:'Phone',kind:'phone',section:'Customer'},{name:'whatsappUserId',label:'WhatsApp user ID',kind:'text',section:'Technical information'},{name:'managedBy',label:'Managed by',kind:'text',section:'Conversation'},{name:'createdDate',label:'Started',kind:'datetime',section:'System information'},{name:'updatedDate',label:'Last activity',kind:'datetime',section:'System information'}]}
];
for(const key of ['page-visits','chats']){
 const config=entities.find(entity=>entity.key===key);
 if(config&&!config.fields.some(field=>field.name==='journeyId')){
  const visitorIndex=config.fields.findIndex(field=>field.name==='visitorId');
  config.fields.splice(visitorIndex+1,0,{name:'journeyId',label:'Journey ID',kind:'text',section:'Relationships'});
  const listIndex=config.listFields.indexOf('visitorId');
  config.listFields.splice(listIndex+1,0,'journeyId');
 }
}
export const entityMap=Object.fromEntries(entities.map(e=>[e.key,e]));
