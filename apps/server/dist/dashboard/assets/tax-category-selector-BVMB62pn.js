import{bh as l,j as a,fu as c,aV as m,aW as u,aX as x,T as d,aY as p,fv as g,aZ as j,bo as h,bj as f}from"./index-CaiHHcHc.js";const C=h(`
    query TaxCategories($options: TaxCategoryListOptions) {
        taxCategories(options: $options) {
            items {
                id
                name
                isDefault
            }
        }
    }
`);function y({value:t,onChange:i}){const{data:s,isLoading:n,isPending:r,status:S}=l({queryKey:["taxCategories"],staleTime:3e5,queryFn:()=>f.query(C,{options:{take:100}})});return n||r?a.jsx(c,{className:"h-10 w-full"}):a.jsxs(m,{items:s?Object.fromEntries(s.taxCategories.items.map(e=>[e.id,e.name])):{},value:t??"",onValueChange:e=>e&&i(e),children:[a.jsx(u,{children:a.jsx(x,{placeholder:a.jsx(d,{id:"LWiFS0"}),children:e=>s?.taxCategories.items.find(o=>o.id===e)?.name})}),a.jsx(p,{children:s&&a.jsx(g,{children:s?.taxCategories.items.map(e=>a.jsx(j,{value:e.id,children:e.name},e.id))})})]})}export{y as T};
