import{ae as l,j as s,bu as c,b0 as m,b1 as u,b2 as d,aE as x,b3 as p,bv as g,b4 as j,ad as h,af as C}from"./index-VtSx0UEl.js";const S=h(`
    query TaxCategories($options: TaxCategoryListOptions) {
        taxCategories(options: $options) {
            items {
                id
                name
                isDefault
            }
        }
    }
`);function T({value:t,onChange:i}){const{data:a,isLoading:n,isPending:r,status:b}=l({queryKey:["taxCategories"],staleTime:3e5,queryFn:()=>C.query(S,{options:{take:100}})});return n||r?s.jsx(c,{className:"h-10 w-full"}):s.jsxs(m,{items:a?Object.fromEntries(a.taxCategories.items.map(e=>[e.id,e.name])):{},value:t??"",onValueChange:e=>e&&i(e),children:[s.jsx(u,{children:s.jsx(d,{placeholder:s.jsx(x,{id:"LWiFS0"}),children:e=>a?.taxCategories.items.find(o=>o.id===e)?.name})}),s.jsx(p,{children:a&&s.jsx(g,{children:a?.taxCategories.items.map(e=>s.jsx(j,{value:e.id,children:e.name},e.id))})})]})}export{T};
