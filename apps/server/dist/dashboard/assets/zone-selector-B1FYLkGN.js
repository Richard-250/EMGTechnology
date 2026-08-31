import{ae as l,j as s,bu as c,b0 as m,b1 as d,b2 as u,aE as p,b3 as h,bv as j,b4 as x,ad as b,af as S}from"./index-Do89KXOB.js";const f=b(`
    query Zones($options: ZoneListOptions) {
        zones(options: $options) {
            items {
                id
                name
            }
        }
    }
`);function y({value:a,onChange:t}){const{data:n,isLoading:i,isPending:o}=l({queryKey:["zones"],staleTime:3e5,queryFn:()=>S.query(f,{options:{take:100}})});return i||o?s.jsx(c,{className:"h-10 w-full"}):s.jsxs(m,{items:n?Object.fromEntries(n.zones.items.map(e=>[e.id,e.name])):{},value:a??"",onValueChange:e=>e&&t(e),children:[s.jsx(d,{children:s.jsx(u,{placeholder:s.jsx(p,{id:"p3M+0h"}),children:e=>n?.zones.items.find(r=>r.id===e)?.name})}),s.jsx(h,{children:n&&s.jsx(j,{children:n?.zones.items.map(e=>s.jsx(x,{value:e.id,children:e.name},e.id))})})]})}export{y as Z};
