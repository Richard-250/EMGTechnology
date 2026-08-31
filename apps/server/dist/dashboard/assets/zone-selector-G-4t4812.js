import{D as l,j as s,ar as c,X as m,Y as d,Z as u,T as p,_ as h,as as j,$ as x,a1 as S,G as f}from"./index-7GHnTCEJ.js";const g=S(`
    query Zones($options: ZoneListOptions) {
        zones(options: $options) {
            items {
                id
                name
            }
        }
    }
`);function q({value:a,onChange:t}){const{data:n,isLoading:i,isPending:o}=l({queryKey:["zones"],staleTime:3e5,queryFn:()=>f.query(g,{options:{take:100}})});return i||o?s.jsx(c,{className:"h-10 w-full"}):s.jsxs(m,{items:n?Object.fromEntries(n.zones.items.map(e=>[e.id,e.name])):{},value:a??"",onValueChange:e=>e&&t(e),children:[s.jsx(d,{children:s.jsx(u,{placeholder:s.jsx(p,{id:"p3M+0h"}),children:e=>n?.zones.items.find(r=>r.id===e)?.name})}),s.jsx(h,{children:n&&s.jsx(j,{children:n?.zones.items.map(e=>s.jsx(x,{value:e.id,children:e.name},e.id))})})]})}export{q as Z};
