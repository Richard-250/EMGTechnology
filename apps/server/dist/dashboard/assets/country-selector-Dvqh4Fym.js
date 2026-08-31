import{r,ae as u,j as e,ba as x,bb as h,bc as p,aE as n,aJ as j,bd as b,be as f,bf as C,bg as g,bh as y,bi as S,bj as v,ad as N,af as q}from"./index-e5NXp7s2.js";const O=N(`
    query CountryList($options: CountryListOptions) {
        countries(options: $options) {
            items {
                id
                name
                code
            }
            totalItems
        }
    }
`);function T(t){const[i,o]=r.useState(!1),[a,l]=r.useState(""),{data:c,isLoading:d}=u({queryKey:["countries",a],queryFn:()=>q.query(O,{options:{sort:{name:"ASC"},filter:a?{name:{contains:a},code:{contains:a}}:void 0,filterOperator:a?"OR":void 0}}),staleTime:1e3*60*60}),m=s=>{l(s)};return e.jsxs(x,{open:i,onOpenChange:o,children:[e.jsxs(h,{render:e.jsx(j,{variant:"outline",size:"sm",type:"button",disabled:t.readOnly,className:"gap-2"}),children:[e.jsx(p,{className:"h-4 w-4"}),t.label??e.jsx(n,{id:"hJmVtD"})]}),e.jsx(b,{className:"p-0 w-[350px]",align:"start",children:e.jsxs(f,{shouldFilter:!1,children:[e.jsxs("div",{className:"flex items-center border-b px-3",children:[e.jsx(C,{className:"mr-2 h-4 w-4 shrink-0 opacity-50"}),e.jsx(g,{placeholder:"Search countries...",onValueChange:m,className:"h-10 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"})]}),e.jsxs(y,{children:[e.jsx(S,{children:d?e.jsx(n,{id:"Z3FXyt"}):e.jsx(n,{id:"Bj9qwi"})}),c?.countries.items.map(s=>e.jsxs(v,{onSelect:()=>{t.onSelect(s),o(!1)},className:"flex flex-col items-start",children:[e.jsx("div",{className:"font-medium",children:s.name}),e.jsx("div",{className:"text-sm text-muted-foreground",children:s.code})]},s.id))]})]})})]})}export{T as C};
