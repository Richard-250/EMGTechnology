import{l as i,j as t,ar as n,T as o,g as a}from"./index-CXKWWRpm.js";const r=a(`
    query SellerList($options: SellerListOptions) {
        sellers(options: $options) {
            items {
                id
                name
            }
            totalItems
        }
    }
`);function c(e){const{_:s}=i();return t.jsx(n,{config:{listQuery:r,idKey:"id",labelKey:"name",placeholder:s({id:"ZPVB4K"})},selectorLabel:e.label??t.jsx(o,{id:"mj8NP+"}),value:e.value??void 0,onChange:l=>{typeof l=="string"&&e.onChange(l)},disabled:e.readOnly})}export{c as S};
