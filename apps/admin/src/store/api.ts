import {createApi,fetchBaseQuery,type BaseQueryFn,type FetchArgs,type FetchBaseQueryError} from '@reduxjs/toolkit/query/react';
export type ListResponse={items:Record<string,unknown>[];total:number;page:number;pageSize:number;pages:number};
export const API_BASE_URL=import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:8081/api';
const rawBaseQuery=fetchBaseQuery({baseUrl:API_BASE_URL,credentials:'include'});
const authenticatedBaseQuery:BaseQueryFn<string|FetchArgs,unknown,FetchBaseQueryError>=async(args,api,extraOptions)=>{
  const result=await rawBaseQuery(args,api,extraOptions);
  if(result.error?.status===401)window.dispatchEvent(new Event('admin:unauthorized'));
  return result;
};
export const adminApi=createApi({reducerPath:'adminApi',baseQuery:authenticatedBaseQuery,tagTypes:['Entity'],endpoints:(b)=>({
list:b.query<ListResponse,{entity:string;params?:Record<string,string>}>({query:({entity,params})=>({url:`/${entity}`,params}),providesTags:(_r,_e,a)=>[{type:'Entity',id:a.entity}]}),
getOne:b.query<Record<string,unknown>,{entity:string;id:string}>({query:({entity,id})=>`/${entity}/${id}`,providesTags:(_r,_e,a)=>[{type:'Entity',id:`${a.entity}:${a.id}`}]}),
createOne:b.mutation<Record<string,unknown>,{entity:string;body:Record<string,unknown>}>({query:({entity,body})=>({url:`/${entity}`,method:'POST',body}),invalidatesTags:(_r,_e,a)=>[{type:'Entity',id:a.entity}]}),
updateOne:b.mutation<Record<string,unknown>,{entity:string;id:string;body:Record<string,unknown>}>({query:({entity,id,body})=>({url:`/${entity}/${id}`,method:'PATCH',body}),invalidatesTags:(_r,_e,a)=>[{type:'Entity',id:a.entity},{type:'Entity',id:`${a.entity}:${a.id}`}] }),
deleteOne:b.mutation<void,{entity:string;id:string}>({query:({entity,id})=>({url:`/${entity}/${id}`,method:'DELETE'}),invalidatesTags:(_r,_e,a)=>[{type:'Entity',id:a.entity}]}),
sendChat:b.mutation({query:({id,message,advisorId}:{id:string;message:string;advisorId?:string})=>({url:`/chats/${id}/messages`,method:'POST',body:{message,advisorId}}),invalidatesTags:(_r,_e,a)=>[{type:'Entity',id:`chats:${a.id}`}]}),
})});
export const {useListQuery,useGetOneQuery,useCreateOneMutation,useUpdateOneMutation,useDeleteOneMutation,useSendChatMutation}=adminApi;
