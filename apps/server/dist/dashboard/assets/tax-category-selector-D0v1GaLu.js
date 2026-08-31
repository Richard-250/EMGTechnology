import{u as l,j as a,as as c,_ as m,$ as u,a0 as x,T as d,a1 as g,at as p,a2 as j,g as h,a as C}from"./index-C9A49B9o.js";const S=h(`
    query TaxCategories($options: TaxCategoryListOptions) {
        taxCategories(options: $options) {
            items {
                id
                name
                isDefault
            }
        }
    }
`);function y({value:t,onChange:i}){const{data:s,isLoading:n,isPending:r,status:T}=l({queryKey:["taxCategories"],staleTime:3e5,queryFn:()=>C.query(S,{options:{take:100}})});return n||r?a.jsx(c,{className:"h-10 w-full"}):a.jsxs(m,{items:s?Object.fromEntries(s.taxCategories.items.map(e=>[e.id,e.name])):{},value:t??"",onValueChange:e=>e&&i(e),children:[a.jsx(u,{children:a.jsx(x,{placeholder:a.jsx(d,{id:"LWiFS0"}),children:e=>s?.taxCategories.items.find(o=>o.id===e)?.name})}),a.jsx(g,{children:s&&a.jsx(p,{children:s?.taxCategories.items.map(e=>a.jsx(j,{value:e.id,children:e.name},e.id))})})]})}export{y as T};
