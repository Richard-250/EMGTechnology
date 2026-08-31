import{r as a,ar as b,aQ as h,aR as j,ay as o,g5 as A,ai as N,g6 as L,j as s,dK as P,aJ as $,cH as T,f_ as _,aE as D,ad as F}from"./index-DPPH9LZw.js";import{C as G}from"./customer-selector-CpIEeVdx.js";const n=F(`
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
`);function q({customerGroupId:r,canAddCustomers:u=!0}){const[d,l]=a.useState([]),[m,c]=a.useState(1),[g,p]=a.useState(10),[C,f]=a.useState([]),{_:i}=b(),S=h(),{mutate:x}=j({mutationFn:N.mutate(L),onSuccess:()=>{o.success(i({id:"y3tQ/s"})),S.invalidateQueries({queryKey:[A,n]})},onError:()=>{o.error(i({id:"ZlA28n"}))}});return s.jsxs("div",{children:[s.jsx(P,{listQuery:_(n),transformVariables:e=>({...e,id:r}),page:m,itemsPerPage:g,sorting:d,columnFilters:C,onPageChange:(e,t,y)=>{c(t),p(y)},onSortChange:(e,t)=>{l(t)},onFilterChange:(e,t)=>{f(t)},onSearchTermChange:e=>({lastName:{contains:e},emailAddress:{contains:e}}),additionalColumns:{name:{header:"Name",cell:({row:e})=>{const t=`${e.original.firstName} ${e.original.lastName}`;return s.jsx($,{render:s.jsx(T,{to:"/customers/$id",params:{id:e.original.id}}),variant:"ghost",children:t})}}},defaultColumnOrder:["name","emailAddress"],defaultVisibility:{id:!1,createdAt:!1,updatedAt:!1,firstName:!1,lastName:!1}}),u&&s.jsx(G,{onSelect:e=>{x({customerId:e.id,groupId:r})},label:s.jsx(D,{id:"IswRMs"})})]})}export{q as C};
