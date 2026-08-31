import{D as l,j as s,ar as c,X as m,Y as u,Z as x,T as d,_ as p,as as g,$ as j,a1 as h,G as C}from"./index-ChmgUFwP.js";const S=h(`
    query TaxCategories($options: TaxCategoryListOptions) {
        taxCategories(options: $options) {
            items {
                id
                name
                isDefault
            }
        }
    }
`);function y({value:t,onChange:i}){const{data:a,isLoading:r,isPending:n,status:T}=l({queryKey:["taxCategories"],staleTime:3e5,queryFn:()=>C.query(S,{options:{take:100}})});return r||n?s.jsx(c,{className:"h-10 w-full"}):s.jsxs(m,{items:a?Object.fromEntries(a.taxCategories.items.map(e=>[e.id,e.name])):{},value:t??"",onValueChange:e=>e&&i(e),children:[s.jsx(u,{children:s.jsx(x,{placeholder:s.jsx(d,{id:"LWiFS0"}),children:e=>a?.taxCategories.items.find(o=>o.id===e)?.name})}),s.jsx(p,{children:a&&s.jsx(g,{children:a?.taxCategories.items.map(e=>s.jsx(j,{value:e.id,children:e.name},e.id))})})]})}export{y as T};
