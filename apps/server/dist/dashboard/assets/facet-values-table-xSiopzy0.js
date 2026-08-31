import{j as t,eI as j,r as i,aB as D,cb as C,eJ as y,B as P,bs as k,T as B,aJ as T,bo as A}from"./index-CaiHHcHc.js";import{D as L}from"./detail-page-button-DR4dz3Ab.js";import{D as $}from"./delete-bulk-action-Cv-PN3Oy.js";const q=({selection:a,table:n})=>t.jsx($,{mutationDocument:j,entityName:"facets",requiredPermissions:["DeleteCatalog","DeleteFacet"],selection:a,table:n}),r="facet-values-table",v=A(`
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
`);function N({facetId:a,registerRefresher:n}){const[m,d]=i.useState([]),[c,g]=i.useState(1),[o,b]=i.useState(10),{setTableSettings:u,settings:f}=D(),p=i.useRef(()=>{}),l=f.tableSettings?.[r],F={name:!0,code:!0},V=l?.columnVisibility??F,h=l?.columnOrder??[],x=l?.columnFilters;return t.jsxs(t.Fragment,{children:[t.jsx(C,{listQuery:y(v),page:c,itemsPerPage:o,sorting:m,columnFilters:x,defaultColumnOrder:h,defaultVisibility:V,onPageChange:(e,s,S)=>{b(S),g(s)},onSortChange:(e,s)=>{d(s)},onFilterChange:(e,s)=>{u(r,"columnFilters",s)},onColumnVisibilityChange:(e,s)=>{u(r,"columnVisibility",s)},registerRefresher:e=>{p.current=e,n?.(e)},transformVariables:e=>({options:{filter:{...e.options?.filter??{},facetId:{eq:a}},sort:e.options?.sort,take:o,skip:(c-1)*o}}),onSearchTermChange:e=>({name:{contains:e}}),customizeColumns:{name:{header:"Name",cell:({row:e})=>t.jsx(L,{id:e.original.id,label:e.original.name,href:`/facets/${a}/values/${e.original.id}`})}},bulkActions:[{component:q}]}),t.jsx("div",{className:"mt-4",children:t.jsxs(P,{render:t.jsx(T,{to:`/facets/${a}/values/new`}),variant:"outline",children:[t.jsx(k,{}),t.jsx(B,{id:"GZg2Zw"})]})})]})}export{N as F};
