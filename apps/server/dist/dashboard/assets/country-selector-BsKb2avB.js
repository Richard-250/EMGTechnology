import{r,D as u,j as e,a6 as x,a7 as h,a8 as p,T as n,B as j,a9 as f,aa as C,ab as y,ac as g,ad as S,ae as v,af as N,a1 as b,G as q}from"./index-bLd4jo8h.js";const O=b(`
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
`);function L(t){const[i,o]=r.useState(!1),[a,l]=r.useState(""),{data:c,isLoading:m}=u({queryKey:["countries",a],queryFn:()=>q.query(O,{options:{sort:{name:"ASC"},filter:a?{name:{contains:a},code:{contains:a}}:void 0,filterOperator:a?"OR":void 0}}),staleTime:1e3*60*60}),d=s=>{l(s)};return e.jsxs(x,{open:i,onOpenChange:o,children:[e.jsxs(h,{render:e.jsx(j,{variant:"outline",size:"sm",type:"button",disabled:t.readOnly,className:"gap-2"}),children:[e.jsx(p,{className:"h-4 w-4"}),t.label??e.jsx(n,{id:"hJmVtD"})]}),e.jsx(f,{className:"p-0 w-[350px]",align:"start",children:e.jsxs(C,{shouldFilter:!1,children:[e.jsxs("div",{className:"flex items-center border-b px-3",children:[e.jsx(y,{className:"mr-2 h-4 w-4 shrink-0 opacity-50"}),e.jsx(g,{placeholder:"Search countries...",onValueChange:d,className:"h-10 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"})]}),e.jsxs(S,{children:[e.jsx(v,{children:m?e.jsx(n,{id:"Z3FXyt"}):e.jsx(n,{id:"Bj9qwi"})}),c?.countries.items.map(s=>e.jsxs(N,{onSelect:()=>{t.onSelect(s),o(!1)},className:"flex flex-col items-start",children:[e.jsx("div",{className:"font-medium",children:s.name}),e.jsx("div",{className:"text-sm text-muted-foreground",children:s.code})]},s.id))]})]})})]})}export{L as C};
