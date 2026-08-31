import{u as l,bh as r,j as p,bF as u,bo as d,bj as m}from"./index-CaiHHcHc.js";const h=d(`
    query Roles($options: RoleListOptions) {
        roles(options: $options) {
            items {
                id
                code
                description
            }
        }
    }
`);function b(o){const{value:t,onChange:i,multiple:n}=o,{_:s}=l(),{data:a}=r({queryKey:["roles"],queryFn:()=>m.query(h,{options:{take:100}}),select:e=>e.roles.items}),c=(a??[]).map(e=>({value:e.id,label:e.code,display:e.description?e.description:e.code}));return p.jsx(u,{value:t,onChange:i,multiple:n,items:c,placeholder:s({id:"h4pFju"}),searchPlaceholder:s({id:"jxxbqF"})})}export{b as R};
