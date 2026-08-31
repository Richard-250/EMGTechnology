import{r,bq as x,ah as h,j as e,ba as p,bb as j,bc as b,aE as n,aJ as f,bd as N,be as C,bg as g,bh as y,bi as S,bj as v,ad as O,ai as q}from"./index-C0rQiKs_.js";const T=O(`
    query GetCustomers($options: CustomerListOptions) {
        customers(options: $options) {
            items {
                id
                firstName
                lastName
                emailAddress
            }
            totalItems
        }
    }
`);function E(t){const[i,o]=r.useState(!1),[l,m]=r.useState(""),a=x(l,300),{data:d,isLoading:c}=h({queryKey:["customers",a],queryFn:()=>q.query(T,{options:{sort:{lastName:"ASC"},filter:a?{firstName:{contains:a},lastName:{contains:a},emailAddress:{contains:a}}:void 0,filterOperator:a?"OR":void 0}}),staleTime:1e3*60}),u=s=>{m(s)};return e.jsxs(p,{open:i,onOpenChange:o,children:[e.jsxs(j,{render:e.jsx(f,{variant:"outline",size:"sm",type:"button",disabled:t.readOnly,className:"gap-2"}),children:[e.jsx(b,{className:"h-4 w-4"}),t.label??e.jsx(n,{id:"C0uyNO"})]}),e.jsx(N,{className:"p-0 w-[350px]",align:"start",children:e.jsxs(C,{shouldFilter:!1,children:[e.jsx(g,{placeholder:"Search customers...",onValueChange:u,className:"h-10 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"}),e.jsxs(y,{children:[e.jsx(S,{children:c?e.jsx(n,{id:"Z3FXyt"}):e.jsx(n,{id:"BLXWJv"})}),d?.customers.items.map(s=>e.jsxs(v,{onSelect:()=>{t.onSelect(s),o(!1)},className:"flex flex-col items-start",children:[e.jsxs("div",{className:"font-medium",children:[s.firstName," ",s.lastName]}),e.jsx("div",{className:"text-sm text-muted-foreground",children:s.emailAddress})]},s.id))]})]})})]})}export{E as C};
