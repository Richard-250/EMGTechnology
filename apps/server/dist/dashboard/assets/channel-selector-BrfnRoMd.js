import{ar as r,ah as u,j as s,a$ as d,b9 as h,ad as p,ai as m}from"./index-C0rQiKs_.js";const q=p(`
    query channels($options: ChannelListOptions) {
        channels(options: $options) {
            items {
                id
                code
            }
        }
    }
`);function C(n){const{value:t,onChange:o,multiple:l}=n,{_:a}=r(),{data:i}=u({queryKey:["channels"],queryFn:()=>m.query(q,{}),staleTime:1e3*60*5}),c=(i?.channels.items??[]).map(e=>({value:e.id,label:e.code,display:s.jsx(d,{code:e.code})}));return s.jsx(h,{value:t,onChange:o,multiple:l,items:c,placeholder:a({id:"Ce8q3L"}),searchPlaceholder:a({id:"PLeYjq"})})}export{C};
