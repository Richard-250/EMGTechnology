import{ag as l,ai as a,bu as c,b0 as m,b1 as u,b2 as x,aE as d,b3 as g,bv as p,b4 as h,ac as j,ah as C}from"./index-BzqLKldm.js";const S=j(`
    query TaxCategories($options: TaxCategoryListOptions) {
        taxCategories(options: $options) {
            items {
                id
                name
                isDefault
            }
        }
    }
`);function T({value:t,onChange:i}){const{data:s,isLoading:n,isPending:r,status:b}=l({queryKey:["taxCategories"],staleTime:3e5,queryFn:()=>C.query(S,{options:{take:100}})});return n||r?a.jsx(c,{className:"h-10 w-full"}):a.jsxs(m,{items:s?Object.fromEntries(s.taxCategories.items.map(e=>[e.id,e.name])):{},value:t??"",onValueChange:e=>e&&i(e),children:[a.jsx(u,{children:a.jsx(x,{placeholder:a.jsx(d,{id:"LWiFS0"}),children:e=>s?.taxCategories.items.find(o=>o.id===e)?.name})}),a.jsx(g,{children:s&&a.jsx(p,{children:s?.taxCategories.items.map(e=>a.jsx(h,{value:e.id,children:e.name},e.id))})})]})}export{T};
