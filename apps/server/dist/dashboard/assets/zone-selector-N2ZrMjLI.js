import{ag as l,ai as s,bu as c,b0 as m,b1 as d,b2 as u,aE as p,b3 as h,bv as x,b4 as j,ac as b,ah as S}from"./index-BeRhW8jK.js";const g=b(`
    query Zones($options: ZoneListOptions) {
        zones(options: $options) {
            items {
                id
                name
            }
        }
    }
`);function y({value:a,onChange:i}){const{data:n,isLoading:t,isPending:o}=l({queryKey:["zones"],staleTime:3e5,queryFn:()=>S.query(g,{options:{take:100}})});return t||o?s.jsx(c,{className:"h-10 w-full"}):s.jsxs(m,{items:n?Object.fromEntries(n.zones.items.map(e=>[e.id,e.name])):{},value:a??"",onValueChange:e=>e&&i(e),children:[s.jsx(d,{children:s.jsx(u,{placeholder:s.jsx(p,{id:"p3M+0h"}),children:e=>n?.zones.items.find(r=>r.id===e)?.name})}),s.jsx(h,{children:n&&s.jsx(x,{children:n?.zones.items.map(e=>s.jsx(j,{value:e.id,children:e.name},e.id))})})]})}export{y as Z};
