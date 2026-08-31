import{r as a,u as h,bg as j,bi as y,t as o,eQ as A,bj as N,eR as L,j as s,cb as P,B as T,aJ as $,eJ as D,T as F,bo as G}from"./index-CaiHHcHc.js";import{C as M}from"./customer-selector-Brc0hop6.js";const n=G(`
    query CustomerGroupMemberList($id: ID!, $options: CustomerListOptions) {
        customerGroup(id: $id) {
            customers(options: $options) {
                items {
                    id
                    createdAt
                    updatedAt
                    firstName
                    lastName
                    emailAddress
                }
                totalItems
            }
        }
    }
`);function q({customerGroupId:r,canAddCustomers:u=!0}){const[l,d]=a.useState([]),[m,c]=a.useState(1),[g,p]=a.useState(10),[C,f]=a.useState([]),{_:i}=h(),b=j(),{mutate:S}=y({mutationFn:N.mutate(L),onSuccess:()=>{o.success(i({id:"y3tQ/s"})),b.invalidateQueries({queryKey:[A,n]})},onError:()=>{o.error(i({id:"ZlA28n"}))}});return s.jsxs("div",{children:[s.jsx(P,{listQuery:D(n),transformVariables:e=>({...e,id:r}),page:m,itemsPerPage:g,sorting:l,columnFilters:C,onPageChange:(e,t,x)=>{c(t),p(x)},onSortChange:(e,t)=>{d(t)},onFilterChange:(e,t)=>{f(t)},onSearchTermChange:e=>({lastName:{contains:e},emailAddress:{contains:e}}),additionalColumns:{name:{header:"Name",cell:({row:e})=>{const t=`${e.original.firstName} ${e.original.lastName}`;return s.jsx(T,{render:s.jsx($,{to:"/customers/$id",params:{id:e.original.id}}),variant:"ghost",children:t})}}},defaultColumnOrder:["name","emailAddress"],defaultVisibility:{id:!1,createdAt:!1,updatedAt:!1,firstName:!1,lastName:!1}}),u&&s.jsx(M,{onSelect:e=>{S({customerId:e.id,groupId:r})},label:s.jsx(F,{id:"IswRMs"})})]})}export{q as C};
