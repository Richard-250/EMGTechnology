import{r,dx as x,bh as h,j as e,aC as p,aD as j,bs as f,T as n,B as C,aF as N,cf as g,ch as y,ci as b,cj as S,ck as v,bo as O,bj as T}from"./index-CaiHHcHc.js";const q=O(`
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
`);function F(t){const[i,o]=r.useState(!1),[l,m]=r.useState(""),a=x(l,300),{data:c,isLoading:d}=h({queryKey:["customers",a],queryFn:()=>T.query(q,{options:{sort:{lastName:"ASC"},filter:a?{firstName:{contains:a},lastName:{contains:a},emailAddress:{contains:a}}:void 0,filterOperator:a?"OR":void 0}}),staleTime:1e3*60}),u=s=>{m(s)};return e.jsxs(p,{open:i,onOpenChange:o,children:[e.jsxs(j,{render:e.jsx(C,{variant:"outline",size:"sm",type:"button",disabled:t.readOnly,className:"gap-2"}),children:[e.jsx(f,{className:"h-4 w-4"}),t.label??e.jsx(n,{id:"C0uyNO"})]}),e.jsx(N,{className:"p-0 w-[350px]",align:"start",children:e.jsxs(g,{shouldFilter:!1,children:[e.jsx(y,{placeholder:"Search customers...",onValueChange:u,className:"h-10 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"}),e.jsxs(b,{children:[e.jsx(S,{children:d?e.jsx(n,{id:"Z3FXyt"}):e.jsx(n,{id:"BLXWJv"})}),c?.customers.items.map(s=>e.jsxs(v,{onSelect:()=>{t.onSelect(s),o(!1)},className:"flex flex-col items-start",children:[e.jsxs("div",{className:"font-medium",children:[s.firstName," ",s.lastName]}),e.jsx("div",{className:"text-sm text-muted-foreground",children:s.emailAddress})]},s.id))]})]})})]})}export{F as C};
