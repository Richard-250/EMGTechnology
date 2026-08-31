import{r as n,j as a,cG as p,B as C,bE as h,eX as S,a1 as x}from"./index-7GHnTCEJ.js";const P=x(`
    query CollectionContentsList($collectionId: ID!, $options: ProductVariantListOptions) {
        collection(id: $collectionId) {
            id
            productVariants(options: $options) {
                items {
                    id
                    createdAt
                    updatedAt
                    name
                    sku
                }
                totalItems
            }
        }
    }
`);function $({collectionId:s}){const[o,i]=n.useState([]),[r,l]=n.useState(1),[c,u]=n.useState(10),[d,m]=n.useState([]);return a.jsx(p,{listQuery:S(P),transformVariables:t=>({...t,collectionId:s}),customizeColumns:{name:{header:"Variant name",cell:({row:t})=>a.jsxs(C,{render:a.jsx(h,{to:`../../product-variants/${t.original.id}`}),variant:"ghost",children:[t.original.name," "]})}},page:r,itemsPerPage:c,sorting:o,columnFilters:d,onPageChange:(t,e,g)=>{l(e),u(g)},onSortChange:(t,e)=>{i(e)},onFilterChange:(t,e)=>{m(e)},onSearchTermChange:t=>({name:{contains:t}})})}export{$ as C};
