import{r as a,l as h,J as y,K as j,t as o,f3 as A,a as N,f4 as L,j as s,cH as P,B as T,bF as $,eY as F,T as D,g as G}from"./index-CyggsTNk.js";import{C as M}from"./customer-selector-Dc9DOMaW.js";const n=G(`
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
`);function v({customerGroupId:r,canAddCustomers:u=!0}){const[l,d]=a.useState([]),[m,c]=a.useState(1),[g,p]=a.useState(10),[f,C]=a.useState([]),{_:i}=h(),S=y(),{mutate:b}=j({mutationFn:N.mutate(L),onSuccess:()=>{o.success(i({id:"y3tQ/s"})),S.invalidateQueries({queryKey:[A,n]})},onError:()=>{o.error(i({id:"ZlA28n"}))}});return s.jsxs("div",{children:[s.jsx(P,{listQuery:F(n),transformVariables:e=>({...e,id:r}),page:m,itemsPerPage:g,sorting:l,columnFilters:f,onPageChange:(e,t,x)=>{c(t),p(x)},onSortChange:(e,t)=>{d(t)},onFilterChange:(e,t)=>{C(t)},onSearchTermChange:e=>({lastName:{contains:e},emailAddress:{contains:e}}),additionalColumns:{name:{header:"Name",cell:({row:e})=>{const t=`${e.original.firstName} ${e.original.lastName}`;return s.jsx(T,{render:s.jsx($,{to:"/customers/$id",params:{id:e.original.id}}),variant:"ghost",children:t})}}},defaultColumnOrder:["name","emailAddress"],defaultVisibility:{id:!1,createdAt:!1,updatedAt:!1,firstName:!1,lastName:!1}}),u&&s.jsx(M,{onSelect:e=>{b({customerId:e.id,groupId:r})},label:s.jsx(D,{id:"IswRMs"})})]})}export{v as C};
