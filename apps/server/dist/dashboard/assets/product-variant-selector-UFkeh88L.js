import{r as o,bq as u,ah as l,j as s,ba as m,bb as p,bc as x,aJ as h,bd as b,be as f,bg as j,bh as g,bi as A,br as N,bj as V,b8 as y,ad as C,bs as P,ai as k}from"./index-C0rQiKs_.js";const q=C(`
        query ProductVariantList($options: ProductVariantListOptions) {
            productVariants(options: $options) {
                items {
                    id
                    name
                    sku
                    featuredAsset {
                        ...Asset
                    }
                    price
                    priceWithTax
                    product {
                        featuredAsset {
                            ...Asset
                        }
                    }
                }
                totalItems
            }
        }
    `,[P]);function I({onProductVariantSelect:r}){const[n,d]=o.useState(""),[c,a]=o.useState(!1),t=u(n,500),{data:i}=l({queryKey:["productVariants",t],staleTime:1e3*60*5,enabled:t.length>0,queryFn:()=>k.query(q,{options:{take:10,filter:{name:{contains:t},sku:{contains:t}},filterOperator:"OR"}})});return s.jsxs(m,{open:c,onOpenChange:a,children:[s.jsxs(p,{render:s.jsx(h,{variant:"outline",role:"combobox",className:"w-full"}),children:["Add item to order",s.jsx(x,{className:"opacity-50"})]}),s.jsx(b,{className:"p-0",children:s.jsxs(f,{shouldFilter:!1,children:[s.jsx(j,{placeholder:"Add item to order...",className:"h-9",onValueChange:e=>d(e)}),s.jsxs(g,{children:[s.jsx(A,{children:"No products found."}),s.jsx(N,{children:i?.productVariants.items.map(e=>s.jsxs(V,{value:e.id,onSelect:()=>{r({productVariantId:e.id,productVariantName:e.name,sku:e.sku,productAsset:e.featuredAsset??e.product.featuredAsset??null,price:e.price,priceWithTax:e.priceWithTax}),a(!1)},className:"flex items-center gap-2 p-2",children:[e.featuredAsset&&s.jsx(y,{asset:e.featuredAsset,preset:"tiny",className:"size-8 rounded-md object-cover"}),s.jsxs("div",{className:"flex flex-col",children:[s.jsx("span",{className:"text-sm font-medium",children:e.name}),s.jsx("span",{className:"text-xs text-muted-foreground",children:e.sku})]})]},e.id))})]})]})})]})}export{I as P};
