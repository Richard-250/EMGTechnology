import{j as t,eX as j,r as i,bB as D,cH as C,eY as y,B as P,aa as k,T as B,bF as T,g as A}from"./index-CyggsTNk.js";import{D as L}from"./detail-page-button-49AfkvU5.js";import{D as $}from"./delete-bulk-action-Di7Hwu5P.js";const q=({selection:a,table:n})=>t.jsx($,{mutationDocument:j,entityName:"facets",requiredPermissions:["DeleteCatalog","DeleteFacet"],selection:a,table:n}),r="facet-values-table",v=A(`
    query FacetValueList($options: FacetValueListOptions) {
        facetValues(options: $options) {
            items {
                id
                createdAt
                updatedAt
                name
                code
                customFields
            }
            totalItems
        }
    }
`);function N({facetId:a,registerRefresher:n}){const[m,g]=i.useState([]),[c,d]=i.useState(1),[o,f]=i.useState(10),{setTableSettings:u,settings:b}=D(),p=i.useRef(()=>{}),l=b.tableSettings?.[r],F={name:!0,code:!0},V=l?.columnVisibility??F,h=l?.columnOrder??[],x=l?.columnFilters;return t.jsxs(t.Fragment,{children:[t.jsx(C,{listQuery:y(v),page:c,itemsPerPage:o,sorting:m,columnFilters:x,defaultColumnOrder:h,defaultVisibility:V,onPageChange:(e,s,S)=>{f(S),d(s)},onSortChange:(e,s)=>{g(s)},onFilterChange:(e,s)=>{u(r,"columnFilters",s)},onColumnVisibilityChange:(e,s)=>{u(r,"columnVisibility",s)},registerRefresher:e=>{p.current=e,n?.(e)},transformVariables:e=>({options:{filter:{...e.options?.filter??{},facetId:{eq:a}},sort:e.options?.sort,take:o,skip:(c-1)*o}}),onSearchTermChange:e=>({name:{contains:e}}),customizeColumns:{name:{header:"Name",cell:({row:e})=>t.jsx(L,{id:e.original.id,label:e.original.name,href:`/facets/${a}/values/${e.original.id}`})}},bulkActions:[{component:q}]}),t.jsx("div",{className:"mt-4",children:t.jsxs(P,{render:t.jsx(T,{to:`/facets/${a}/values/new`}),variant:"outline",children:[t.jsx(k,{}),t.jsx(B,{id:"GZg2Zw"})]})})]})}export{N as F};
