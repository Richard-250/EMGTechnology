import{r as a,b as h,A as y,E as A,t as o,f2 as j,G as N,f3 as G,j as s,cG as L,B as P,bE as T,eX as $,T as D,a1 as E}from"./index-bLd4jo8h.js";import{C as F}from"./customer-selector-DPOIUYIi.js";const n=E(`
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
`);function q({customerGroupId:r,canAddCustomers:u=!0}){const[l,d]=a.useState([]),[m,c]=a.useState(1),[p,g]=a.useState(10),[f,C]=a.useState([]),{_:i}=h(),S=y(),{mutate:b}=A({mutationFn:N.mutate(G),onSuccess:()=>{o.success(i({id:"y3tQ/s"})),S.invalidateQueries({queryKey:[j,n]})},onError:()=>{o.error(i({id:"ZlA28n"}))}});return s.jsxs("div",{children:[s.jsx(L,{listQuery:$(n),transformVariables:e=>({...e,id:r}),page:m,itemsPerPage:p,sorting:l,columnFilters:f,onPageChange:(e,t,x)=>{c(t),g(x)},onSortChange:(e,t)=>{d(t)},onFilterChange:(e,t)=>{C(t)},onSearchTermChange:e=>({lastName:{contains:e},emailAddress:{contains:e}}),additionalColumns:{name:{header:"Name",cell:({row:e})=>{const t=`${e.original.firstName} ${e.original.lastName}`;return s.jsx(P,{render:s.jsx(T,{to:"/customers/$id",params:{id:e.original.id}}),variant:"ghost",children:t})}}},defaultColumnOrder:["name","emailAddress"],defaultVisibility:{id:!1,createdAt:!1,updatedAt:!1,firstName:!1,lastName:!1}}),u&&s.jsx(F,{onSelect:e=>{b({customerId:e.id,groupId:r})},label:s.jsx(D,{id:"IswRMs"})})]})}export{q as C};
